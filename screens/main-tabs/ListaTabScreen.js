import React from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ListaTabScreen({
  styles,
  palette,
  isSupabaseConfigured,
  shoppingInput,
  setShoppingInput,
  isMutatingList,
  handleAddItem,
  canClearCompleted,
  canClearAll,
  handleClearCompleted,
  handleClearAll,
  listFeedback,
  isListLoading,
  shoppingItems,
  decodeShoppingItemName,
  handleToggleItem,
}) {
  return (
    <View>
      <Text style={styles.title}>Lista de Compras</Text>
      <Text style={styles.body}>Agrega rápido lo del súper y márcalo cuando esté listo.</Text>

      {!isSupabaseConfigured ? (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            Configura `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` para usar la lista.
          </Text>
        </View>
      ) : null}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ej. Tomates, Leche, Arroz..."
          placeholderTextColor={palette.mutedText}
          value={shoppingInput}
          onChangeText={setShoppingInput}
          editable={!isMutatingList}
          onSubmitEditing={handleAddItem}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.addButton, (isMutatingList || !shoppingInput.trim()) && styles.buttonDisabled]}
          onPress={handleAddItem}
          disabled={isMutatingList || !shoppingInput.trim()}
        >
          <Ionicons name="add" size={20} color={palette.card} />
        </TouchableOpacity>
      </View>

      <View style={styles.listActions}>
        <TouchableOpacity
          style={[styles.secondaryAction, (!canClearCompleted || isMutatingList) && styles.buttonDisabled]}
          onPress={handleClearCompleted}
          disabled={!canClearCompleted || isMutatingList}
        >
          <Text style={styles.secondaryActionText}>Borrar completado</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryAction, (!canClearAll || isMutatingList) && styles.buttonDisabled]}
          onPress={handleClearAll}
          disabled={!canClearAll || isMutatingList}
        >
          <Text style={styles.secondaryActionText}>Borrar todo</Text>
        </TouchableOpacity>
      </View>

      {listFeedback ? <Text style={styles.feedback}>{listFeedback}</Text> : null}

      {isListLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={palette.accent} />
        </View>
      ) : (
        <View style={styles.listCard}>
          {shoppingItems.length === 0 ? (
            <Text style={styles.emptyText}>Todavía no tienes items en tu lista.</Text>
          ) : (
            shoppingItems.map((item) => {
              const { displayName, sourceRecipeName } = decodeShoppingItemName(item.name);

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.listItem}
                  onPress={() => handleToggleItem(item)}
                  disabled={isMutatingList}
                >
                  <View style={styles.listItemContent}>
                    <Text style={[styles.itemText, item.is_completed && styles.itemTextCompleted]}>
                      {displayName}
                    </Text>
                    {sourceRecipeName ? (
                      <Text
                        style={[
                          styles.itemSourceText,
                          item.is_completed && styles.itemSourceTextCompleted,
                        ]}
                      >
                        de {sourceRecipeName}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons
                    name={item.is_completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={item.is_completed ? '#16A34A' : palette.accent}
                  />
                </TouchableOpacity>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

