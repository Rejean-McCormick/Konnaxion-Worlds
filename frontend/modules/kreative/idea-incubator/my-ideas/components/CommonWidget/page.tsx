// FILE: frontend/modules/kreative/idea-incubator/my-ideas/components/CommonWidget/page.tsx
// pages/pageTemplate/components/CommonWidget.tsx
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
      <p className={styles.widgetDescription}>{description}</p>
    </div>
  );
};

export default CommonWidget;
