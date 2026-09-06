// FILE: frontend/modules/kreative/dashboard/components/CommonWidget/page.tsx
import React from 'react';

import styles from '@/shared/CommonWidget.module.css';

interface CommonWidgetProps {
  title: string;
  description: string;
  /** Optional variants */
  dense?: boolean;
  comfy?: boolean;
  flat?: boolean;
  accent?: boolean;
  className?: string;
}

const CommonWidget: React.FC<CommonWidgetProps> = ({
  title,
  description,
  dense,
  comfy,
  flat,
  accent,
  className,
}) => {
  const classes = [
    styles.widget,
    dense && styles.widgetDense,
    comfy && styles.widgetComfy,
    flat && styles.widgetFlat,
    accent && styles.widgetAccent,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <h2 className={styles.widgetTitle}>{title}</h2>
      <p className={styles.widgetDescription}>{description}</p>
    </div>
  );
};

export default CommonWidget;
