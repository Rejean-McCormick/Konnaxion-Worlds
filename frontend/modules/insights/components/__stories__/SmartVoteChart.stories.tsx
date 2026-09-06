// FILE: frontend/modules/insights/components/__stories__/SmartVoteChart.stories.tsx
import SmartVoteChart from '../SmartVoteChart';

export default {
  title: 'Insights/SmartVoteChart',
  component: SmartVoteChart,
};

export const Basic = {
  args: {
    labels: ['Option 1', 'Option 2'],
    votes: [42, 23],
    scores: [1.3, 2.1],
  },
};
