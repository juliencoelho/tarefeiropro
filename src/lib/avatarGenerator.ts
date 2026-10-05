/**
 * Gera um avatar SVG baseado nas iniciais do nome
 * @param name - Nome completo do usuário
 * @param size - Tamanho do avatar em pixels (padrão: 150)
 * @returns URL data do SVG gerado
 */
export function generateAvatarSVG(name: string, size: number = 150): string {
  // Extrair iniciais do nome
  const initials = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  // Gerar cor baseada no hash do nome
  const colors = [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
    '#06B6D4', // cyan-500
    '#84CC16', // lime-500
    '#F97316', // orange-500
    '#EC4899', // pink-500
    '#6366F1', // indigo-500
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % colors.length;
  const backgroundColor = colors[colorIndex];

  // Criar SVG
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${backgroundColor}" rx="${size / 8}"/>
      <text 
        x="50%" 
        y="50%" 
        dominant-baseline="middle" 
        text-anchor="middle" 
        fill="white" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="${size * 0.4}" 
        font-weight="600"
      >
        ${initials}
      </text>
    </svg>
  `;

  // Converter para data URL
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Lista de avatares pré-definidos para usuários mock
 */
export const mockAvatars = {
  'Administrador': generateAvatarSVG('Administrador'),
  'João Silva': generateAvatarSVG('João Silva'),
  'Maria Santos': generateAvatarSVG('Maria Santos'),
  'Carlos Oliveira': generateAvatarSVG('Carlos Oliveira'),
  'Ana Costa': generateAvatarSVG('Ana Costa'),
  'Carlos Ferreira': generateAvatarSVG('Carlos Ferreira'),
  'Lucia Rodrigues': generateAvatarSVG('Lucia Rodrigues'),
  'Rafael Almeida': generateAvatarSVG('Rafael Almeida'),
  'Fernanda Lima': generateAvatarSVG('Fernanda Lima'),
  'Bruno Martins': generateAvatarSVG('Bruno Martins'),
};