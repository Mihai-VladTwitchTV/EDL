import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '../utils/theme';

export interface ContentCardData {
  id: string;
  title: string;
  description?: string;
  contentType: 'DOCUMENT' | 'VIDEO' | 'QUIZ';
  mandatory: boolean;
  categoryName?: string;
  categoryIconName?: string;
  categoryColorHex?: string;
  thumbnailUrl?: string;
  authorName?: string;
  viewCount: number;
  createdAt: string;
  userAcknowledged?: boolean;
  userCompleted?: boolean;
  userProgressPct?: number;
}

interface Props {
  item: ContentCardData;
  onPress: (item: ContentCardData) => void;
}

const TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  DOCUMENT: 'document-text-outline',
  VIDEO: 'play-circle-outline',
  QUIZ: 'checkmark-circle-outline',
};

const TYPE_COLOR: Record<string, string> = {
  DOCUMENT: '#3B82F6',
  VIDEO: '#8B5CF6',
  QUIZ: '#10B981',
};

export default function ContentCard({ item, onPress }: Props) {
  const isCompleted = item.userCompleted;
  const typeColor = TYPE_COLOR[item.contentType] ?? Colors.primary;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item)}
      activeOpacity={0.85}
    >
      {/* Mandatory banner */}
      {item.mandatory && !item.userAcknowledged && (
        <View style={styles.mandatoryBanner}>
          <Ionicons name="alert-circle" size={13} color={Colors.mandatory} />
          <Text style={styles.mandatoryText}>Action required</Text>
        </View>
      )}

      <View style={styles.row}>
        {/* Type icon pill */}
        <View style={[styles.typePill, { backgroundColor: typeColor + '22' }]}>
          <Ionicons name={TYPE_ICON[item.contentType]} size={22} color={typeColor} />
        </View>

        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>

          {item.description ? (
            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
          ) : null}

          <View style={styles.footer}>
            {/* Category chip */}
            {item.categoryName ? (
              <View style={[styles.chip, { borderColor: item.categoryColorHex ?? Colors.primary }]}>
                <Text style={[styles.chipText, { color: item.categoryColorHex ?? Colors.primary }]}>
                  {item.categoryName}
                </Text>
              </View>
            ) : null}

            {/* Content type chip */}
            <View style={[styles.chip, { borderColor: typeColor }]}>
              <Text style={[styles.chipText, { color: typeColor }]}>
                {item.contentType}
              </Text>
            </View>

            {/* View count */}
            <View style={styles.stat}>
              <Ionicons name="eye-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.statText}>{item.viewCount}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Progress bar for videos */}
      {item.contentType === 'VIDEO' && item.userProgressPct !== undefined && item.userProgressPct > 0 && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${item.userProgressPct}%` as any }]} />
        </View>
      )}

      {/* Completed badge */}
      {isCompleted && (
        <View style={styles.completedBadge}>
          <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
          <Text style={styles.completedText}>Completed</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mandatoryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.mandatoryBg,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    marginBottom: Spacing.sm,
    alignSelf: 'flex-start',
    gap: 4,
  },
  mandatoryText: {
    color: Colors.mandatory,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  typePill: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  meta: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '600',
    lineHeight: 22,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
    alignItems: 'center',
  },
  chip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chipText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  progressBar: {
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
  completedText: {
    color: Colors.success,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
