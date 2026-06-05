import { Tabs } from 'expo-router';
import React from 'react';
import { Icon } from '../../src/components/Icon';
import { useTheme } from '../../src/theme';
import { fonts } from '../../src/theme/tokens';

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgTranslucent,
          borderTopColor: colors.borderSubtle,
          borderTopWidth: 1,
          position: 'absolute',
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.fg2,
        tabBarLabelStyle: {
          fontFamily: fonts.sansMedium,
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Month',
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar-days" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="day"
        options={{
          title: 'Day',
          tabBarIcon: ({ color, size }) => (
            <Icon name="clock" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, size }) => (
            <Icon name="inbox" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null, // Hidden from tab bar — accessed via bell icon in top bar
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Me',
          tabBarIcon: ({ color, size }) => (
            <Icon name="settings" size={size ?? 22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
