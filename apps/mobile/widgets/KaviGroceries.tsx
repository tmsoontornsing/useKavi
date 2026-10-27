import { HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { bold, font, foregroundStyle, lineLimit } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export type KaviGroceriesProps = {
  // Items still to buy, in aisle order, already trimmed to what the biggest size can show, joined with "|".
  // A plain string, because widget props travel as simple values.
  items: string;
  done: number;
  total: number;
};

// The grocery list at a glance: what is left to buy and how far along the trip is. Runs in an isolated widget
// runtime: no hooks, no imports of app code, everything arrives through props. Colours are left to the system in
// tinted (accented) mode so the person's chosen home screen tint applies.
const KaviGroceries = (props: KaviGroceriesProps, env: WidgetEnvironment) => {
  'widget';
  const tinted = env.widgetRenderingMode === 'accented';
  const green = tinted ? undefined : '#1F7A4D';
  const accent = (modifiers: ReturnType<typeof bold>[]) => (green ? [...modifiers, foregroundStyle(green)] : modifiers);
  const list = props.items ? props.items.split('|') : [];
  const left = Math.max(0, props.total - props.done);
  const header = props.total === 0 ? 'GROCERIES' : left === 0 ? 'GROCERIES · ALL DONE' : `GROCERIES · ${left} LEFT`;

  const row = (name: string) => (
    <HStack key={name} spacing={6}>
      <Text modifiers={[font({ size: 12 }), foregroundStyle('secondary')]}>○</Text>
      <Text modifiers={[font({ size: 13, weight: 'medium' }), lineLimit(1)]}>{name}</Text>
    </HStack>
  );

  // Nothing to show: no list yet, or everything is in the cart.
  if (list.length === 0) {
    return (
      <HStack alignment="top">
        <VStack alignment="leading" spacing={4}>
          <Text modifiers={accent([font({ size: 11, weight: 'bold' })])}>GROCERIES</Text>
          <Text modifiers={[font({ size: 17, weight: 'semibold' }), lineLimit(3)]}>
            {props.total > 0 ? 'Everything is in your cart' : 'Plan your week to build a list'}
          </Text>
          <Spacer />
          {props.total > 0 ? <Text modifiers={[font({ size: 12 })]}>{`${props.done} of ${props.total} items`}</Text> : null}
        </VStack>
        <Spacer />
      </HStack>
    );
  }

  // One column of items in the small size; two in the medium; the large size fills both columns taller.
  const perColumn = env.widgetFamily === 'systemSmall' ? 4 : env.widgetFamily === 'systemMedium' ? 4 : 9;
  const columns = env.widgetFamily === 'systemSmall' ? 1 : 2;
  const shown = list.slice(0, perColumn * columns);
  const slices = Array.from({ length: columns }, (_, c) => shown.slice(c * perColumn, (c + 1) * perColumn));
  const more = list.length > shown.length ? left - shown.length : 0;

  return (
    <VStack alignment="leading" spacing={6}>
      <HStack>
        <Text modifiers={accent([font({ size: 11, weight: 'bold' })])}>{header}</Text>
        <Spacer />
      </HStack>
      <HStack alignment="top" spacing={14}>
        {slices.map((slice, c) => (
          <VStack key={c} alignment="leading" spacing={4}>
            {slice.map(row)}
          </VStack>
        ))}
        <Spacer />
      </HStack>
      <Spacer />
      <HStack>
        <Text modifiers={[font({ size: 11 }), foregroundStyle('secondary')]}>
          {more > 0 ? `and ${more} more · ${props.done} of ${props.total} in cart` : `${props.done} of ${props.total} in cart`}
        </Text>
        <Spacer />
      </HStack>
    </VStack>
  );
};

export default createWidget<KaviGroceriesProps>('KaviGroceries', KaviGroceries, {
  items: '',
  done: 0,
  total: 0,
});
