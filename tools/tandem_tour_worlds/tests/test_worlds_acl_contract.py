"""Dependency-free regression tests of the actual Worlds resolver functions.

These checks extract the unmodified function AST from resolver.py and execute it
with a minimal in-memory ORM shim. They make no database or network calls.
Full Django/PostgreSQL integration remains a separate qualification gate.
"""
from __future__ import annotations

import ast
from pathlib import Path
import unittest
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "backend/konnaxion/worlds/resolver.py"


class Manager:
    def __init__(self, rows):
        self.rows = list(rows)

    def filter(self, **kwargs):
        def ok(row):
            for name, desired in kwargs.items():
                if name.endswith("__in"):
                    if getattr(row, name[:-4]) not in desired:
                        return False
                elif getattr(row, name) != desired:
                    return False
            return True
        return Manager([row for row in self.rows if ok(row)])

    def exists(self):
        return bool(self.rows)


def subject(*, universe_visibility="private", universe_member=True,
            world_member=True, staff=False, world_creator=False,
            universe_creator=False, world_role="maintainer"):
    actor = SimpleNamespace(pk=11, is_authenticated=True, is_staff=staff, is_superuser=False)
    ucreator = actor.pk if universe_creator else 20
    wcreator = actor.pk if world_creator else 20
    universe = SimpleNamespace(
        visibility=universe_visibility, created_by_id=ucreator,
    )
    world = SimpleNamespace(universe=universe, created_by_id=wcreator)
    urows = [SimpleNamespace(universe=universe, user=actor, is_active=True, role="member")] if universe_member else []
    wrows = [SimpleNamespace(world=world, user=actor, is_active=True, role=world_role)] if world_member else []
    tree = ast.parse(SOURCE.read_text(encoding="utf-8"), filename=str(SOURCE))
    names = {"can_manage_universe", "can_access_universe", "can_manage_world"}
    funcs = [node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name in names]
    if {f.name for f in funcs} != names:
        raise AssertionError("resolver permission API contract changed")
    env = {
        "Universe": SimpleNamespace(VISIBILITY_PUBLIC="public"),
        "UniverseMembership": SimpleNamespace(
            ROLE_OWNER="owner", ROLE_MAINTAINER="maintainer", objects=Manager(urows),
        ),
        "WorldMembership": SimpleNamespace(
            ROLE_OWNER="owner", ROLE_MAINTAINER="maintainer", objects=Manager(wrows),
        ),
    }
    # Function signatures annotate Universe/World; simple safe types for AST execution.
    env.update({"Universe": type("Universe", (), {"VISIBILITY_PUBLIC":"public"}), "World": object})
    exec(compile(ast.Module(body=funcs, type_ignores=[]), str(SOURCE), "exec"), env)
    return actor, world, env["can_manage_world"]


class WorldsOuterBoundaryTests(unittest.TestCase):
    def test_private_universe_revoked_world_membership_denied(self):
        user, world, check = subject(universe_member=False)
        self.assertFalse(check(user, world))

    def test_private_universe_revoked_direct_world_creator_denied(self):
        user, world, check = subject(universe_member=False, world_creator=True)
        self.assertFalse(check(user, world))

    def test_private_universe_world_manager_granted_when_outer_member(self):
        user, world, check = subject()
        self.assertTrue(check(user, world))

    def test_world_viewer_cannot_manage(self):
        user, world, check = subject(world_role="viewer")
        self.assertFalse(check(user, world))

    def test_public_universe_world_maintainer_can_manage(self):
        user, world, check = subject(universe_visibility="public", universe_member=False)
        self.assertTrue(check(user, world))

    def test_global_staff_bypasses_private_membership_as_designed(self):
        user, world, check = subject(universe_member=False, staff=True, world_member=False)
        self.assertTrue(check(user, world))

    def test_universe_creator_who_created_world_can_manage_it(self):
        user, world, check = subject(universe_member=False, universe_creator=True, world_creator=True, world_member=False)
        self.assertTrue(check(user, world))

    def test_world_maintainer_without_world_membership_denied(self):
        user, world, check = subject(world_member=False)
        self.assertFalse(check(user, world))

    def test_anonymous_denied(self):
        user, world, check = subject()
        user.is_authenticated = False
        self.assertFalse(check(user, world))


if __name__ == "__main__":
    unittest.main()
