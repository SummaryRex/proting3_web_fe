export const approvedReports = [
  { id: 'EX-102', equip: 'Excavator EX-102', desc: 'Lorem ipsum dolor sit amet', operator: 'Dazai Osamu', date: 'Oct 15, 2026' },
  { id: 'DT-204', equip: 'Dump Truck DT-204', desc: 'Lorem ipsum dolor sit amet', operator: 'Nakahara Chuuya', date: 'Oct 16, 2026' },
  { id: 'L-305', equip: 'Loader L-305', desc: 'Lorem ipsum dolor sit amet', operator: 'Gojo Satoru', date: 'Oct 17, 2026' },
];

export const initialSchedules = [
  { id: 'MS-1042', equip: 'Excavator EX-105', mechanic: 'Sarah Williams', date: 'Oct 20, 2023', dateVal: '2023-10-20', priority: 'critical', status: 'scheduled' },
  { id: 'MS-1044', equip: 'Loader L-302', mechanic: 'Robert Taylor', date: 'Oct 19, 2023', dateVal: '2023-10-19', priority: 'low', status: 'completed' },
];

export const statusLabels = { scheduled: 'Scheduled', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' };
export const priorityLabels = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };
