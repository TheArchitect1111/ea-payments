#!/usr/bin/env node
/**
 * Contract: Simplifi Brief Pass 4 — native motion, notifications, and icons.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const home = readFileSync(join(root, 'mobile/app/(app)/home.tsx'), 'utf8');
assert(home.includes('AccessibilityInfo.isReduceMotionEnabled'), 'motion must respect reduce-motion');
assert(home.includes('Animated.stagger'), 'staggered entrance motion required');
assert(home.includes('notifications-outline'), 'notification bell required');
assert(home.includes('unreadCount'), 'notification badge must use real unread count');
assert(home.includes('Ionicons'), 'polished vector icons required');

const layout = readFileSync(join(root, 'mobile/app/(app)/_layout.tsx'), 'utf8');
assert(layout.includes('tabBarIcon'), 'tab bar icons required');
assert(layout.includes('home-outline'), 'Home tab icon required');
assert(layout.includes('add-circle-outline'), 'Capture tab icon required');
assert(layout.includes('file-tray-outline'), 'Inbox tab icon required');
assert(layout.includes('menu-outline'), 'More tab icon required');

const mobilePackage = readFileSync(join(root, 'mobile/package.json'), 'utf8');
assert(mobilePackage.includes('@expo/vector-icons'), 'vector icon dependency required');

if (failures.length) {
  console.error('FAIL');
  for (const failure of failures) console.error(' -', failure);
  process.exit(1);
}

console.log('PASS simplifi-brief-native-polish-contract');
