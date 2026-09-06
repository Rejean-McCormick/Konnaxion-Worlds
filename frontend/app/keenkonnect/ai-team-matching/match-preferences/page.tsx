// C:\MyCode\Konnaxionv14\frontend\app\keenkonnect\ai-team-matching\match-preferences\page.tsx
'use client';

import {
  ProFormSelect,
  ProFormSlider,
  ProFormSwitch,
  ProFormTextArea,
  StepsForm,
} from '@ant-design/pro-components';
import { Alert, Card } from 'antd';
import React from 'react';

import KeenPage from '@/app/keenkonnect/KeenPageShell';

const MatchPreferencesPage: React.FC = () => {
  return (
    <KeenPage
      title="Préférences de matching"
      description="Configure tes préférences pour que KeenKonnect puisse te proposer des équipes et coéquipier·ères qui te correspondent vraiment."
    >
      <Alert
        type="info"
        showIcon
        message="Matching preferences are a declared preview"
        description="You can explore the preference model, but these values are read-only in this build because no AI matching-preferences persistence contract is exposed."
        style={{ marginBottom: 16 }}
      />
      <Card>
        <StepsForm
          containerStyle={{ maxWidth: 840, margin: '0 auto' }}
          onFinish={async () => {
            // Declared preview: no matching-preferences persistence contract exists.
            return false;
          }}
          stepsFormRender={(dom, submitter) => (
            <div>
              {dom}
              <div style={{ marginTop: 24 }}>{submitter}</div>
            </div>
          )}
        >
          {/* Étape 1 — Profil & objectifs */}
          <StepsForm.StepForm
            name="profile"
            title="Profil & objectifs"
            stepProps={{
              description: 'Ce que tu cherches dans l’équipe',
            }}
          >
            <ProFormSelect
              name="matchGoal"
              label="Objectif principal"
              placeholder="Choisis ton objectif principal"
              rules={[
                {
                  required: true,
                  message: 'Merci de préciser ton objectif principal.',
                },
              ]}
              options={[
                { label: 'Trouver un·e cofondateur·rice', value: 'cofounder' },
                { label: 'Trouver une équipe pour un projet', value: 'join_team' },
                { label: 'Trouver des freelances / experts', value: 'freelance' },
                { label: 'Brainstorm / networking uniquement', value: 'networking' },
              ]}
            />

            <ProFormSlider
              name="seniorityPreference"
              label="Niveau d’expérience souhaité dans l’équipe"
              min={1}
              max={10}
              marks={{
                1: 'Très junior',
                5: 'Mixte',
                10: 'Très senior',
              }}
              tooltip={{
                formatter: (value?: number) =>
                  value !== undefined ? `${value}/10` : undefined,
              }}
            />

            <ProFormSelect
              name="timeCommitment"
              label="Disponibilité souhaitée des membres"
              placeholder="Sélectionne une option"
              allowClear
              options={[
                { label: 'Side project (3–5 h / semaine)', value: 'side' },
                { label: 'Engagement modéré (5–10 h / semaine)', value: 'medium' },
                { label: 'Engagement élevé (10h+ / semaine)', value: 'high' },
              ]}
            />

            <ProFormSwitch
              name="remoteOnly"
              label="Je veux uniquement des collaborations 100% à distance"
              fieldProps={{
                checkedChildren: 'Oui',
                unCheckedChildren: 'Non',
              }}
            />
          </StepsForm.StepForm>

          {/* Étape 2 — Style d’équipe */}
          <StepsForm.StepForm
            name="team"
            title="Style d’équipe"
            stepProps={{
              description: 'Comment tu aimes travailler',
            }}
          >
            <ProFormSlider
              name="teamSize"
              label="Taille d’équipe idéale"
              min={2}
              max={12}
              marks={{
                2: 'Très lean',
                5: 'Équipe moyenne',
                10: 'Grosse équipe',
              }}
            />

            <ProFormSelect
              name="communicationStyle"
              label="Style de communication préféré"
              placeholder="Sélectionne ce qui te ressemble le plus"
              options={[
                {
                  label: 'Très structuré (notes, comptes-rendus, suivi serré)',
                  value: 'structured',
                },
                { label: 'Flexible mais réactif', value: 'flexible' },
                { label: 'Informel, au feeling', value: 'casual' },
              ]}
            />

            <ProFormSlider
              name="asyncPreference"
              label="Préférence pour le travail asynchrone"
              min={0}
              max={10}
              marks={{
                0: 'Tout en temps réel',
                5: 'Mixte',
                10: 'Quasi 100% asynchrone',
              }}
            />

            <ProFormSwitch
              name="needsFacilitator"
              label="Je préfère qu’il y ait un·e facilitateur·rice / PM dans l’équipe"
              fieldProps={{
                checkedChildren: 'Oui',
                unCheckedChildren: 'Pas nécessaire',
              }}
            />

            <ProFormSwitch
              name="preferDiverseBackgrounds"
              label="Je souhaite une équipe avec des profils très variés"
              fieldProps={{
                checkedChildren: 'Oui',
                unCheckedChildren: 'Peu importe',
              }}
            />
          </StepsForm.StepForm>

          {/* Étape 3 — Contraintes & priorités */}
          <StepsForm.StepForm
            name="constraints"
            title="Contraintes & priorités"
            stepProps={{
              description: 'Ce qui est non négociable pour toi',
            }}
          >
            <ProFormSlider
              name="timeZoneOverlap"
              label="Chevauchement horaire minimum souhaité"
              min={0}
              max={8}
              marks={{
                0: 'Peu importe',
                2: '2h',
                4: '4h',
                6: '6h',
                8: '8h+',
              }}
              tooltip={{
                formatter: (value?: number) =>
                  value !== undefined ? `${value}h de chevauchement` : undefined,
              }}
            />

            <ProFormSelect
              name="meetingFrequency"
              label="Fréquence de réunions souhaitée"
              placeholder="Sélectionne une option"
              allowClear
              options={[
                { label: '1 fois par semaine', value: 'weekly' },
                { label: '2–3 fois par semaine', value: 'twice_week' },
                { label: 'Quotidien stand-up court', value: 'daily' },
                { label: 'Au besoin uniquement', value: 'on_demand' },
              ]}
            />

            <ProFormSwitch
              name="openToWeekend"
              label="Ok pour travailler ponctuellement le week-end"
              fieldProps={{
                checkedChildren: 'Oui',
                unCheckedChildren: 'Non',
              }}
            />

            <ProFormSwitch
              name="openToNightSessions"
              label="Ok pour des sessions tard le soir si nécessaire"
              fieldProps={{
                checkedChildren: 'Oui',
                unCheckedChildren: 'Non',
              }}
            />

            <ProFormTextArea
              name="notes"
              label="Détails complémentaires pour l’algorithme de matching"
              placeholder="Ex.: je préfère les équipes qui prototypent rapidement, j’évite les projets blockchain, etc."
              fieldProps={{
                autoSize: { minRows: 3, maxRows: 6 },
                showCount: true,
                maxLength: 600,
              }}
            />
          </StepsForm.StepForm>
        </StepsForm>
      </Card>
    </KeenPage>
  );
};

export default MatchPreferencesPage;
