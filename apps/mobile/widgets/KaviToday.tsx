import { HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { bold, font, foregroundStyle, lineLimit } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export type KaviTodayProps = {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  done: number;
  total: number;
};

// Today's three meals and how far along the grocery trip is. Runs in an isolated widget runtime: no hooks,
// no imports of app code, everything arrives through props. Colours are left to the system in tinted
// (accented) mode so the person's chosen home screen tint applies.
const KaviToday = (props: KaviTodayProps, env: WidgetEnvironment) => {
  'widget';
  const tinted = env.widgetRenderingMode === 'accented';
  const green = tinted ? undefined : '#1F7A4D';
  const accent = (modifiers: ReturnType<typeof bold>[]) => (green ? [...modifiers, foregroundStyle(green)] : modifiers);
  const cart = props.total > 0 ? `${props.done} of ${props.total} in cart` : 'No list yet';

  if (env.widgetFamily === 'systemSmall') {
    return (
      <VStack alignment="leading" spacing={4}>
        <Text modifiers={accent([font({ size: 11, weight: 'bold' })])}>{`DINNER · ${props.day.toUpperCase()}`}</Text>
        <Text modifiers={[font({ size: 17, weight: 'semibold' }), lineLimit(3)]}>{props.dinner || 'Plan your week'}</Text>
        <Spacer />
        <Text modifiers={[font({ size: 12 })]}>{cart}</Text>
      </VStack>
    );
  }

  const rows: [string, string][] = [
    ['Breakfast', props.breakfast],
    ['Lunch', props.lunch],
    ['Dinner', props.dinner],
  ];
  return (
    <HStack alignment="top" spacing={12}>
      <VStack alignment="leading" spacing={5}>
        <Text modifiers={accent([font({ size: 11, weight: 'bold' })])}>{`TODAY · ${props.day.toUpperCase()}`}</Text>
        {rows.map(([label, name]) => (
          <HStack key={label} spacing={6}>
            <Text modifiers={[font({ size: 12 }), foregroundStyle('secondary')]}>{label}</Text>
            <Text modifiers={[font({ size: 14, weight: 'medium' }), lineLimit(1)]}>{name || '—'}</Text>
          </HStack>
        ))}
      </VStack>
      <Spacer />
      <VStack alignment="trailing" spacing={2}>
        <Text modifiers={[bold(), font({ size: 22 })]}>{`${props.done}/${props.total}`}</Text>
        <Text modifiers={[font({ size: 11 }), foregroundStyle('secondary')]}>in cart</Text>
      </VStack>
    </HStack>
  );
};

export default createWidget<KaviTodayProps>('KaviToday', KaviToday, {
  day: '',
  breakfast: '',
  lunch: '',
  dinner: '',
  done: 0,
  total: 0,
});
