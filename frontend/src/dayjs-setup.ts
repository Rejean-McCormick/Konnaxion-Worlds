// FILE: frontend/src/dayjs-setup.ts
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
// Ajoute d'autres plugins si besoin: advancedFormat, isBetween, etc.

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);

// Définis la locale si voulu:
// import 'dayjs/locale/fr';
// dayjs.locale('fr');
