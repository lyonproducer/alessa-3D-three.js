export type BodyRegion =
  | 'whole'
  | 'head'
  | 'abdomen'
  | 'arms'
  | 'legs'
  | 'cord';
export const regionLabels: Record<BodyRegion, string> = {
  whole: 'Su tamaño',
  head: 'Cabeza',
  abdomen: 'Abdomen',
  arms: 'Brazos',
  legs: 'Piernas',
  cord: 'Cordón umbilical',
};
export interface Measurement {
  code: string;
  label: string;
  value: string;
  description: string;
  photo: number; // One-based image number in the original monthly album.
}
export interface StudyMeasurements {
  date: string;
  regions: Partial<Record<BodyRegion, Measurement[]>>;
}
// Manually transcribed from the referenced originals. No interpolated values,
// percentile interpretation, inferred laterality, or measurements of the 3D art.
// Terminology: https://www.isuog.org/clinical-resources/fetal-biometry.html
const definitions = {
  BPD: [
    'Diámetro biparietal',
    'Ancho de la cabeza entre los huesos parietales.',
  ],
  HC: ['Circunferencia cefálica', 'Medida del contorno de la cabeza.'],
  AC: ['Circunferencia abdominal', 'Medida del contorno del abdomen.'],
  FL: ['Longitud del fémur', 'Longitud del hueso del muslo.'],
  CRL: [
    'Longitud cráneo-rabadilla',
    'Distancia desde la parte superior de la cabeza hasta la rabadilla.',
  ],
  RAD: [
    'Longitud del radio',
    'Longitud de uno de los dos huesos del antebrazo.',
  ],
  Cúbito: ['Longitud del cúbito', 'Longitud del otro hueso del antebrazo.'],
  Tibia: [
    'Longitud de la tibia',
    'Longitud de uno de los huesos entre la rodilla y el tobillo.',
  ],
  FIB: ['Longitud del peroné', 'Longitud del hueso que acompaña a la tibia.'],
} as const;
function m(
  code: keyof typeof definitions,
  value: string,
  photo: number,
): Measurement {
  return {
    code,
    label: definitions[code][0],
    description: definitions[code][1],
    value,
    photo,
  };
}
export const measurements: Record<string, StudyMeasurements> = {
  mayo: {
    date: '22 de mayo de 2026',
    regions: {
      whole: [m('CRL', '2,25 cm', 5)],
    },
  },
  junio: {
    date: '19 de junio de 2026',
    regions: {
      head: [m('BPD', '2,09 cm', 2), m('HC', '8,77 cm', 2)],
      abdomen: [m('AC', '6,78 cm', 4)],
      legs: [m('FL', '1,04 cm', 4)],
    },
  },
  julio: {
    date: '17 de julio de 2026',
    regions: {
      head: [m('BPD', '3,63 cm', 4), m('HC', '13,73 cm', 4)],
    },
  },
  agosto: {
    date: '12 de agosto de 2026',
    regions: {
      head: [m('BPD', '4,85 cm', 2), m('HC', '18,05 cm', 2)],
      abdomen: [m('AC', '15,33 cm', 7)],
      arms: [m('RAD', '2,83 cm', 5), m('Cúbito', '2,87 cm', 5)],
      legs: [
        m('FL', '3,51 cm', 8),
        m('Tibia', '3,18 cm', 10),
        m('FIB', '2,87 cm', 10),
      ],
    },
  },
};
