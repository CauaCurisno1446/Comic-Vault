export interface AccentColor {
  id: string;
  name: string;
  color: string;
  hover: string;
  muted: string;
}

export const ACCENT_COLORS: AccentColor[] = [
  { id: 'green',  name: 'Verde',   color: '#1db954', hover: '#1ed760', muted: '#1db95433' },
  { id: 'blue',   name: 'Azul',    color: '#228be6', hover: '#1c7ed6', muted: '#228be622' },
  { id: 'purple', name: 'Roxo',    color: '#9b59b6', hover: '#8e44ad', muted: '#9b59b622' },
  { id: 'red',    name: 'Vermelho',color: '#e74c3c', hover: '#c0392b', muted: '#e74c3c22' },
  { id: 'orange', name: 'Laranja', color: '#ff8c00', hover: '#ffa333', muted: '#ff8c0033' },
  { id: 'yellow', name: 'Amarelo', color: '#f1c40f', hover: '#d4ac0d', muted: '#f1c40f22' },
  { id: 'pink',   name: 'Rosa',    color: '#ff79c6', hover: '#ff92d0', muted: '#ff79c633' },
  { id: 'cyan',   name: 'Ciano',   color: '#00d4ff', hover: '#33ddff', muted: '#00d4ff33' },
];
