import { Text, type TextProps, type TextStyle } from 'react-native';

import { fonts, useTheme } from '../theme';

type Variant = 'largeTitle' | 'title' | 'headline' | 'body' | 'subhead' | 'footnote' | 'eyebrow' | 'money';

type Props = TextProps & { variant?: Variant; color?: string; weight?: TextStyle['fontWeight'] };

// One place for the type scale. Body sizes follow iOS defaults (17 body, 15 subhead, 13 footnote).
export function AppText({ variant = 'body', color, weight, style, ...rest }: Props) {
  const c = useTheme();
  const base: Record<Variant, TextStyle> = {
    largeTitle: { fontFamily: fonts.display, fontSize: 30, letterSpacing: -0.6, lineHeight: 34, color: c.text },
    title: { fontFamily: fonts.display, fontSize: 24, lineHeight: 29, color: c.text },
    headline: { fontSize: 17, fontWeight: '600', lineHeight: 22, color: c.text },
    body: { fontSize: 17, lineHeight: 24, color: c.text },
    subhead: { fontSize: 15, lineHeight: 20, color: c.muted },
    footnote: { fontSize: 13, lineHeight: 18, color: c.muted },
    eyebrow: { fontSize: 13, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', color: c.muted },
    money: { fontFamily: fonts.displaySemi, fontSize: 18, color: c.text, fontVariant: ['tabular-nums'] },
  };
  return (
    <Text
      style={[base[variant], color ? { color } : null, weight ? { fontWeight: weight } : null, style]}
      {...rest}
    />
  );
}
