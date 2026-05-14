import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Colors, Spacing, Radius, FontSize } from '../utils/theme';

export type PostTypeFilter = 'ALL' | 'TRAINING' | 'NEWS' | 'EVENT' | 'CHANGE' | 'CAREER' | 'REGULATION';

const FILTERS: { key: PostTypeFilter; label: string }[] = [
  { key: 'ALL',        label: 'All' },
  { key: 'TRAINING',   label: 'Training' },
  { key: 'NEWS',       label: 'News' },
  { key: 'EVENT',      label: 'Events' },
  { key: 'CHANGE',     label: 'Changes' },
  { key: 'CAREER',     label: 'Careers' },
  { key: 'REGULATION', label: 'Regulations' },
];

const FILTER_COLOR: Record<PostTypeFilter, string> = {
  ALL:        Colors.primary,
  TRAINING:   '#3B82F6',
  NEWS:       '#8B5CF6',
  EVENT:      '#F59E0B',
  CHANGE:     '#EF4444',
  CAREER:     '#10B981',
  REGULATION: '#64748B',
};

interface Props {
  selected: PostTypeFilter;
  onSelect: (filter: PostTypeFilter) => void;
}

export default function PostTypeFilterBar({ selected, onSelect }: Props) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {FILTERS.map(({ key, label }) => {
          const active = selected === key;
          const color = FILTER_COLOR[key];
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.pill,
                active
                  ? { backgroundColor: color, borderColor: color }
                  : { backgroundColor: 'transparent', borderColor: color + '55' },
              ]}
              onPress={() => onSelect(key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.pillText, { color: active ? '#fff' : color }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.sm,
  },
  container: {
    paddingHorizontal: Spacing.md,
    gap: 8,
    flexDirection: 'row',
  },
  pill: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  pillText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
