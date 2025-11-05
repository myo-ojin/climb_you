/**
 * Goal Edit Screen
 * 目標の編集・更新画面
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { GoalDetails, GoalEditFormState, GoalUpdateRequest } from '../types';
import GoalService from '../services/GoalService';
import { MCPClient } from '@/core/network/mcp';
import { NetworkErrorHandler, RetryStrategy } from '@/core/network/utils';

interface GoalEditScreenProps {
  goalId: string;
  onGoalUpdated?: (goal: GoalDetails) => void;
  onBack?: () => void;
}

const GoalEditScreen: React.FC<GoalEditScreenProps> = ({
  goalId,
  onGoalUpdated,
  onBack,
}) => {
  const [goal, setGoal] = useState<GoalDetails | null>(null);
  const [formState, setFormState] = useState<GoalEditFormState>({
    title: '',
    description: '',
    kpi: '',
    deadline: '',
    duration: '',
    priority: 'medium',
    status: 'active',
    errors: {},
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mcpClient = new MCPClient({
    baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://api.example.com/mcp',
    timeout: 30000,
    retryAttempts: 3,
  });

  const errorHandler = new NetworkErrorHandler({
    maxRetries: 3,
    initialRetryDelay: 100,
    maxRetryDelay: 1000,
  });

  const retryStrategy = new RetryStrategy({
    maxAttempts: 3,
    initialDelay: 50,
    maxDelay: 500,
  });

  const goalService = new GoalService(mcpClient, errorHandler, retryStrategy);

  useEffect(() => {
    loadGoal();
  }, [goalId]);

  const loadGoal = async () => {
    try {
      setLoading(true);
      const loadedGoal = await goalService.getGoal(goalId);
      setGoal(loadedGoal);
      setFormState({
        title: loadedGoal.title,
        description: loadedGoal.description || '',
        kpi: loadedGoal.kpi,
        deadline: loadedGoal.deadline,
        duration: loadedGoal.duration,
        priority: loadedGoal.priority,
        status: loadedGoal.status,
        errors: {},
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load goal');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formState.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formState.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (!formState.kpi.trim()) {
      newErrors.kpi = 'KPI is required';
    }

    if (!formState.deadline) {
      newErrors.deadline = 'Deadline is required';
    } else {
      const deadlineDate = new Date(formState.deadline);
      if (deadlineDate < new Date()) {
        newErrors.deadline = 'Deadline must be in the future';
      }
    }

    setFormState((prev) => ({ ...prev, errors: newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      const update: GoalUpdateRequest = {
        title: formState.title,
        description: formState.description,
        kpi: formState.kpi,
        deadline: formState.deadline,
        duration: formState.duration,
        priority: formState.priority as any,
        status: formState.status as any,
      };

      const updatedGoal = await goalService.updateGoal(goalId, update);
      onGoalUpdated?.(updatedGoal);
      Alert.alert('Success', 'Goal updated successfully', [
        {
          text: 'OK',
          onPress: onBack,
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update goal');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3C507D" />
      </View>
    );
  }

  if (error && !goal) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={onBack}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const priorityOptions = ['low', 'medium', 'high'];
  const statusOptions = ['active', 'paused', 'completed', 'archived'];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Edit Goal</Text>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>
            Title <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              formState.errors.title && styles.inputError,
            ]}
            placeholder="Enter goal title"
            value={formState.title}
            onChangeText={(text) =>
              setFormState((prev) => ({ ...prev, title: text }))
            }
            editable={!saving}
          />
          {formState.errors.title && (
            <Text style={styles.errorMessage}>{formState.errors.title}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Enter goal description"
            value={formState.description}
            onChangeText={(text) =>
              setFormState((prev) => ({ ...prev, description: text }))
            }
            multiline
            numberOfLines={4}
            editable={!saving}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>
            KPI <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, formState.errors.kpi && styles.inputError]}
            placeholder="Enter KPI (Key Performance Indicator)"
            value={formState.kpi}
            onChangeText={(text) =>
              setFormState((prev) => ({ ...prev, kpi: text }))
            }
            editable={!saving}
          />
          {formState.errors.kpi && (
            <Text style={styles.errorMessage}>{formState.errors.kpi}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Duration</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 3 months, 6 weeks"
            value={formState.duration}
            onChangeText={(text) =>
              setFormState((prev) => ({ ...prev, duration: text }))
            }
            editable={!saving}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>
            Deadline <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              formState.errors.deadline && styles.inputError,
            ]}
            placeholder="YYYY-MM-DD"
            value={formState.deadline}
            onChangeText={(text) =>
              setFormState((prev) => ({ ...prev, deadline: text }))
            }
            editable={!saving}
          />
          {formState.errors.deadline && (
            <Text style={styles.errorMessage}>
              {formState.errors.deadline}
            </Text>
          )}
        </View>

        <View style={styles.row}>
          <View style={styles.halfSection}>
            <Text style={styles.label}>Priority</Text>
            <View style={styles.optionsList}>
              {priorityOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.option,
                    formState.priority === option && styles.optionSelected,
                  ]}
                  onPress={() =>
                    setFormState((prev) => ({ ...prev, priority: option as any }))
                  }
                  disabled={saving}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formState.priority === option &&
                        styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.halfSection}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.optionsList}>
              {statusOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.option,
                    formState.status === option && styles.optionSelected,
                  ]}
                  onPress={() =>
                    setFormState((prev) => ({ ...prev, status: option as any }))
                  }
                  disabled={saving}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formState.status === option && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onBack}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#112250',
    marginBottom: 20,
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: '#D32F2F',
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 16,
    borderRadius: 4,
  },
  errorBannerText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  section: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfSection: {
    flex: 1,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#D32F2F',
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  inputError: {
    borderColor: '#D32F2F',
    backgroundColor: '#FFF5F5',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorMessage: {
    color: '#D32F2F',
    fontSize: 12,
    marginTop: 4,
  },
  optionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  optionSelected: {
    backgroundColor: '#3C507D',
    borderColor: '#3C507D',
  },
  optionText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#FFF',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    backgroundColor: '#FFF',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    backgroundColor: '#FFF',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3C507D',
  },
  saveButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#3C507D',
    marginTop: 12,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  errorText: {
    fontSize: 14,
    color: '#D32F2F',
    textAlign: 'center',
  },
});

export default GoalEditScreen;
