const FIELD_GROUPS = {
  computer: ['user_name', 'ip_address', 'os', 'ram', 'disk_space', 'device_age', 'serial_number', 'install_date', 'location'],
  printer: ['ip_address', 'serial_number', 'install_date', 'location'],
  network: ['ip_address', 'serial_number', 'install_date', 'location'],
  mobile: ['user_name', 'ip_address', 'serial_number', 'install_date', 'location'],
  camera: ['ip_address', 'serial_number', 'install_date', 'location'],
  generic: ['user_name', 'ip_address', 'serial_number', 'install_date', 'location'],
};

const OPTIONAL_FIELDS = ['user_name', 'ip_address', 'os', 'ram', 'disk_space', 'device_age', 'serial_number', 'install_date', 'location'];

export const getDeviceCategory = (device = {}) => {
  const type = String(device.type || '').toLowerCase();
  const icon = device.icon || '';

  if (type.includes('printer') || type.includes('scanner') || icon === '🖨️') return 'printer';
  if (type.includes('router') || type.includes('switch') || type.includes('access point') || type.includes('firewall') || type.includes('network') || icon === '🛜' || icon === '📡') return 'network';
  if (type.includes('phone') || type.includes('mobile') || type.includes('tablet') || icon === '📱') return 'mobile';
  if (type.includes('camera') || type.includes('cctv') || icon === '📷') return 'camera';
  if (type.includes('pc') || type.includes('laptop') || type.includes('desktop') || type.includes('workstation') || type.includes('server') || icon === '💻' || icon === '🖥️' || icon === '🗄️') return 'computer';

  return 'generic';
};

export const getVisibleDeviceFields = (device = {}) => {
  const category = getDeviceCategory(device);
  return new Set(FIELD_GROUPS[category] || FIELD_GROUPS.generic);
};

export const getCategoryLabel = (device = {}) => {
  const category = getDeviceCategory(device);

  if (category === 'computer') return 'Computer fields';
  if (category === 'printer') return 'Printer fields';
  if (category === 'network') return 'Network device fields';
  if (category === 'mobile') return 'Mobile device fields';
  if (category === 'camera') return 'Camera fields';
  return 'General device fields';
};

export const sanitizeDevicePayload = (device = {}) => {
  const visible = getVisibleDeviceFields(device);
  const next = { ...device };

  OPTIONAL_FIELDS.forEach((field) => {
    if (!visible.has(field)) {
      next[field] = '';
    }
  });

  return next;
};
