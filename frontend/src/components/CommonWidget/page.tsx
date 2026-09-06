// FILE: frontend/src/components/CommonWidget/page.tsx
import React from 'react';

import styles from '@/shared/CommonWidget.module.css';

interface CommonWidgetProps {
  title: string;
  description: string;
}

const CommonWidget: React.FC<CommonWidgetProps> = ({ title, description }) => {
  return (
    <div className={styles.widget}>
      <h2 className={styles.widgetTitle}>{title}</h2>
      <p className={styles.widgetSubtitle}>{description}</p>
    </div>
  );
};

export default CommonWidget;
