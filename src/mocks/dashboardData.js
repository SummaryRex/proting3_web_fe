export const barChartData = [
  { day: 'Mon', h: '30%', active: false },
  { day: 'Tue', h: '38%', active: false },
  { day: 'Wed', h: '34%', active: false },
  { day: 'Thu', h: '42%', active: false },
  { day: 'Fri', h: '85%', active: true },
  { day: 'Sat', h: '22%', active: false },
  { day: 'Sun', h: '15%', active: false },
];

export const latestReports = [
  { id: '#REP-8092', equip: 'Excavator EX-04', operator: 'Andre Taulani', date: 'Today, 09:41 AM', status: 'pending' },
  { id: '#REP-8091', equip: 'Loader WL-12', operator: 'Gita Gutawa', date: 'Yesterday, 14:20', status: 'progress' },
  { id: '#REP-8090', equip: 'Haul Truck #42', operator: 'Joko Widodo', date: 'Oct 24, 2026', status: 'critical' },
  { id: '#REP-8089', equip: 'Drill Rig DR-02', operator: 'Anies Baswedan', date: 'Oct 23, 2026', status: 'resolved' },
];

export const statCards = [
  { label: 'TOTAL EQUIP', value: '152' },
  { label: 'UNDER\nMAINTENANCE', value: '25' },
  { label: 'ACTIVE', value: '120' },
  { label: 'PENDING DMG', value: '7' },
];

export const statusLabels = {
  pending: 'Pending',
  progress: 'In Progress',
  critical: 'Critical',
  resolved: 'Resolved',
};
