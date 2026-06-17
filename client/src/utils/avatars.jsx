import React from 'react';
import { Pencil, Palette, Ruler, Brain, FlaskConical, Lightbulb, Backpack, Rocket } from 'lucide-react';

export const getAvatarIcon = (name, size = 24) => {
  switch (name) {
    case '✏️':
    case 'pencil':
      return <Pencil size={size} />;
    case '🎨':
    case 'palette':
      return <Palette size={size} />;
    case '📐':
    case 'ruler':
      return <Ruler size={size} />;
    case '🧠':
    case 'brain':
      return <Brain size={size} />;
    case '🔬':
    case 'flask':
      return <FlaskConical size={size} />;
    case '💡':
    case 'lightbulb':
      return <Lightbulb size={size} />;
    case '🎒':
    case 'backpack':
      return <Backpack size={size} />;
    case '🚀':
    case 'rocket':
      return <Rocket size={size} />;
    default:
      return <Pencil size={size} />;
  }
};
