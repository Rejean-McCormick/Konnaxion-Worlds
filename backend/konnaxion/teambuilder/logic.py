import random
import math
from django.db import transaction
from django.utils import timezone
from .models import BuilderSession, Team, TeamMember

# -----------------------------------------------------------------------------
# Public Entry Point
# -----------------------------------------------------------------------------

def generate_teams_for_session(session_id: str):
    """
    Main logic function to organize candidates into teams based on session config.
    """
    with transaction.atomic():
        # 1. Fetch Session
        try:
            session = BuilderSession.objects.get(pk=session_id)
        except BuilderSession.DoesNotExist:
            return {"error": "Session not found"}

        # 2. Update Status
        session.status = BuilderSession.Status.PROCESSING
        session.save()

        # 3. Clean up previous runs (Idempotency)
        session.teams.all().delete()

        # 4. Get Configuration
        candidates = list(session.candidates.all())
        if not candidates:
            session.status = BuilderSession.Status.DRAFT
            session.save()
            return {"error": "No candidates selected"}

        config = session.algorithm_config or {}
        target_size = int(config.get("target_team_size", 4))
        strategy = config.get("strategy", "balanced_expertise")  # 'random' or 'balanced_expertise'

        # 5. Execute Algorithm
        # Calculate how many teams we need
        total_candidates = len(candidates)
        num_teams = math.ceil(total_candidates / target_size)
        
        # Determine algorithm
        if strategy == "random":
            teams_structure = _strategy_random(candidates, num_teams)
        else:
            teams_structure = _strategy_balanced_expertise(candidates, num_teams)

        # 6. Save Results to DB
        _persist_teams(session, teams_structure)

        # 7. Finalize
        session.status = BuilderSession.Status.COMPLETED
        session.save()

    return {"success": True, "teams_generated": len(teams_structure)}


# -----------------------------------------------------------------------------
# Strategies
# -----------------------------------------------------------------------------

def _strategy_random(candidates, num_teams):
    """
    Shuffles candidates and deals them like cards into N teams.
    """
    random.shuffle(candidates)
    
    # Initialize empty buckets
    teams = [[] for _ in range(num_teams)]
    
    # Distribute round-robin
    for i, user in enumerate(candidates):
        team_index = i % num_teams
        teams[team_index].append({
            "user": user,
            "role": "Member",
            "reason": "Random assignment"
        })
    
    return teams


def _strategy_balanced_expertise(candidates, num_teams):
    """
    Sorts candidates by 'score' (Expertise) and distributes them using a 
    Snake Draft method (1, 2, 3, 3, 2, 1) to ensure balanced total team strength.
    """
    # 1. Annotate candidates with scores
    scored_candidates = []
    for user in candidates:
        score = _get_user_score(user)
        scored_candidates.append((score, user))

    # 2. Sort by score descending (Strongest first)
    scored_candidates.sort(key=lambda x: x[0], reverse=True)

    # 3. Initialize buckets
    teams = [[] for _ in range(num_teams)]

    # 4. Snake Distribution
    # This prevents Team 1 from getting all the best people if we just did simple round-robin.
    # Pattern: 0,1,2, 2,1,0, 0,1,2...
    for i, (score, user) in enumerate(scored_candidates):
        # Calculate index logic for snake draft
        cycle = i // num_teams
        remainder = i % num_teams
        
        if cycle % 2 == 0:
            # Forward pass (0 -> N)
            team_index = remainder
        else:
            # Backward pass (N -> 0)
            team_index = (num_teams - 1) - remainder

        teams[team_index].append({
            "user": user,
            "role": "Specialist" if score > 80 else "Member",
            "reason": f"Balanced fit (Score: {score})"
        })

    return teams


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------

def _get_user_score(user):
    """
    Retrieves the 'Ekoh Score' (Expertise).
    """
    # TODO: Connect this to the actual Ekoh module models.
    # For now, we simulate a score or grab a profile field if it exists.
    # In a real integration: return user.ekoh_profile.total_score
    try:
        # Checking if the user object has a cached property or related profile
        if hasattr(user, 'ekoh_score'):
            return user.ekoh_score
        return random.randint(40, 99) # Placeholder for development
    except Exception:
        return 50

def _persist_teams(session, teams_structure):
    """
    Writes the logical team structure into actual DB rows.
    """
    for i, members_data in enumerate(teams_structure):
        team_name = f"Team {i + 1}"
        
        # Create Team
        team = Team.objects.create(
            session=session,
            name=team_name,
            metrics={"member_count": len(members_data)}
        )

        # Add Members
        for member_info in members_data:
            TeamMember.objects.create(
                team=team,
                user=member_info['user'],
                suggested_role=member_info['role'],
                match_reason=member_info['reason']
            )

        # Update Team metrics with actual averages (Post-creation calculation)
        # (Optional: Add logic here to sum up scores and save to team.metrics)