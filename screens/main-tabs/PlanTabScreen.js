import React from 'react';
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PlanTabScreen({
  styles,
  palette,
  formattedPlanWeekRange,
  shiftPlanWeek,
  isPlanLoading,
  isMutatingPlan,
  planFeedback,
  planWeekDays,
  handleOpenPlanAssignForDay,
  handleOpenPlanRecipeDetail,
  handleOpenPlanAssignForDayMeal,
  handleRemoveRecipeFromPlanSlot,
}) {
  const weekdayFormatter = new Intl.DateTimeFormat('es-ES', { weekday: 'long' });
  const dayNumberFormatter = new Intl.DateTimeFormat('es-ES', { day: 'numeric' });

  return (
    <View>
      <Text style={styles.title}>Plan de comidas</Text>

      <View style={styles.planWeekHeader}>
        <TouchableOpacity
          style={styles.planWeekArrowButton}
          onPress={() => shiftPlanWeek(-1)}
          disabled={isPlanLoading || isMutatingPlan}
        >
          <Ionicons name="chevron-back" size={20} color={palette.card} />
        </TouchableOpacity>
        <Text style={styles.planWeekRangeText}>{formattedPlanWeekRange}</Text>
        <TouchableOpacity
          style={styles.planWeekArrowButton}
          onPress={() => shiftPlanWeek(1)}
          disabled={isPlanLoading || isMutatingPlan}
        >
          <Ionicons name="chevron-forward" size={20} color={palette.card} />
        </TouchableOpacity>
      </View>

      {planFeedback ? <Text style={styles.planFeedback}>{planFeedback}</Text> : null}

      {isPlanLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={palette.accent} />
        </View>
      ) : (
        <View style={styles.planDaysList}>
          {planWeekDays.map((dayItem) => {
            const weekdayRaw = dayItem.dateObject
              ? weekdayFormatter.format(dayItem.dateObject)
              : dayItem.isoDate;
            const weekdayLabel = `${weekdayRaw.charAt(0).toUpperCase()}${weekdayRaw.slice(1)} ${
              dayItem.dateObject ? dayNumberFormatter.format(dayItem.dateObject) : ''
            }`.trim();
            const mealSlots = [
              {
                key: 'desayuno',
                label: 'Desayuno',
                recipe: dayItem.breakfastRecipe,
              },
              {
                key: 'snack',
                label: 'Snack',
                recipe: dayItem.snackRecipe,
              },
              {
                key: 'almuerzo',
                label: 'Almuerzo',
                recipe: dayItem.lunchRecipe,
              },
              {
                key: 'cena',
                label: 'Cena',
                recipe: dayItem.dinnerRecipe,
              },
            ];
            const hasAtLeastOneRecipe = mealSlots.some((slot) => Boolean(slot.recipe));

            return (
              <View key={`plan-day-${dayItem.isoDate}`} style={styles.planDayBlock}>
                <View style={styles.planDayHeader}>
                  <Text style={styles.planDayTitle}>{weekdayLabel}</Text>
                  <TouchableOpacity
                    style={styles.planDayAddButton}
                    onPress={() => handleOpenPlanAssignForDay(dayItem.isoDate)}
                    disabled={isMutatingPlan}
                  >
                    <Ionicons name="add" size={18} color={palette.card} />
                  </TouchableOpacity>
                </View>

                {hasAtLeastOneRecipe ? (
                  <View style={styles.planMealPreviewRow}>
                    {mealSlots.map((slot) => {
                      const hasRecipe = Boolean(slot.recipe);

                      return (
                        <View key={`meal-slot-${dayItem.isoDate}-${slot.key}`} style={styles.planMealSlotWrap}>
                          <TouchableOpacity
                            style={styles.planMealSlot}
                            onPress={() => {
                              if (hasRecipe) {
                                handleOpenPlanRecipeDetail(slot.recipe.id);
                                return;
                              }

                              handleOpenPlanAssignForDayMeal(dayItem.isoDate, slot.key);
                            }}
                            disabled={isMutatingPlan}
                          >
                            {slot.recipe?.main_photo_url ? (
                              <Image
                                source={{ uri: slot.recipe.main_photo_url }}
                                style={styles.planMealSlotImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={styles.planMealSlotPlaceholder}>
                                <Ionicons name="restaurant-outline" size={14} color="#7A8A99" />
                                <Text style={styles.planMealSlotLabel}>{slot.label}</Text>
                              </View>
                            )}
                          </TouchableOpacity>

                          {hasRecipe ? (
                            <TouchableOpacity
                              style={[
                                styles.planMealRemoveButton,
                                isMutatingPlan && styles.buttonDisabled,
                              ]}
                              onPress={() => handleRemoveRecipeFromPlanSlot(dayItem.isoDate, slot.key)}
                              disabled={isMutatingPlan}
                            >
                              <Ionicons name="close" size={12} color={palette.card} />
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.planDayEmptyPill}
                    onPress={() => handleOpenPlanAssignForDay(dayItem.isoDate)}
                    disabled={isMutatingPlan}
                  >
                    <Text style={styles.planDayEmptyText}>Aún no hay recetas</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

