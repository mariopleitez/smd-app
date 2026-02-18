import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { fonts, palette, spacing } from '../theme';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export default function PrincipalScreen({ onLogout, userEmail, userId }) {
  const tabs = useMemo(
    () => [
      { key: 'recetas', label: 'Recetas', icon: 'book-outline' },
      { key: 'lista', label: 'Lista', icon: 'checkbox-outline' },
      { key: 'plan', label: 'Plan', icon: 'calendar-outline' },
      { key: 'perfil', label: 'Perfil', icon: 'person-outline' },
    ],
    []
  );
  const [activeTab, setActiveTab] = useState('recetas');
  const [displayedTab, setDisplayedTab] = useState('recetas');
  const [shoppingItems, setShoppingItems] = useState([]);
  const [shoppingInput, setShoppingInput] = useState('');
  const [isListLoading, setIsListLoading] = useState(false);
  const [isMutatingList, setIsMutatingList] = useState(false);
  const [listFeedback, setListFeedback] = useState('');
  const [cookbooks, setCookbooks] = useState([]);
  const [cookbookInput, setCookbookInput] = useState('');
  const [isCookbooksLoading, setIsCookbooksLoading] = useState(false);
  const [isMutatingCookbooks, setIsMutatingCookbooks] = useState(false);
  const [cookbookFeedback, setCookbookFeedback] = useState('');
  const [isCreateRecipeSheetOpen, setIsCreateRecipeSheetOpen] = useState(false);
  const [isImportUrlModalOpen, setIsImportUrlModalOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [isImportingRecipe, setIsImportingRecipe] = useState(false);
  const [importFeedback, setImportFeedback] = useState('');
  const [isManualRecipeModalOpen, setIsManualRecipeModalOpen] = useState(false);
  const [manualRecipeTitle, setManualRecipeTitle] = useState('');
  const [manualMainPhotoUrl, setManualMainPhotoUrl] = useState('');
  const [manualRecipeDescription, setManualRecipeDescription] = useState('');
  const [manualIngredients, setManualIngredients] = useState(['']);
  const [manualSteps, setManualSteps] = useState(['']);
  const [manualRecipeFeedback, setManualRecipeFeedback] = useState('');
  const [isSavingManualRecipe, setIsSavingManualRecipe] = useState(false);
  const [manualRecipeEditingId, setManualRecipeEditingId] = useState(null);
  const [isCookbookPickerOpen, setIsCookbookPickerOpen] = useState(false);
  const [selectedCookbookIds, setSelectedCookbookIds] = useState([]);
  const [selectedCookbookForView, setSelectedCookbookForView] = useState(null);
  const [selectedRecipeForView, setSelectedRecipeForView] = useState(null);
  const [recipeDetailMode, setRecipeDetailMode] = useState('view');
  const [recipeDetailFeedback, setRecipeDetailFeedback] = useState('');
  const [isSavingRecipeDetail, setIsSavingRecipeDetail] = useState(false);
  const [isRecipeCookbookPickerOpen, setIsRecipeCookbookPickerOpen] = useState(false);
  const [recipeCookbookSelectionIds, setRecipeCookbookSelectionIds] = useState([]);
  const [isSavingRecipeCookbookSelection, setIsSavingRecipeCookbookSelection] = useState(false);
  const [isRecipeListPickerOpen, setIsRecipeListPickerOpen] = useState(false);
  const [recipeListIngredients, setRecipeListIngredients] = useState([]);
  const [selectedRecipeListIngredientKeys, setSelectedRecipeListIngredientKeys] = useState([]);
  const [isAddingRecipeIngredientsToList, setIsAddingRecipeIngredientsToList] = useState(false);
  const [isPlanAssignModalOpen, setIsPlanAssignModalOpen] = useState(false);
  const [planAssignmentRecipe, setPlanAssignmentRecipe] = useState(null);
  const [planAssignDate, setPlanAssignDate] = useState('');
  const [planAssignMealType, setPlanAssignMealType] = useState('almuerzo');
  const [isSavingPlanAssignment, setIsSavingPlanAssignment] = useState(false);
  const [planAssignFeedback, setPlanAssignFeedback] = useState('');
  const [planWeekStartIso, setPlanWeekStartIso] = useState(() => {
    const today = new Date();
    const todayDay = today.getDay();
    const mondayOffset = (todayDay + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - mondayOffset);
    return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(
      monday.getDate()
    ).padStart(2, '0')}`;
  });
  const [mealPlansByDate, setMealPlansByDate] = useState({});
  const [planRecipesById, setPlanRecipesById] = useState({});
  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [planFeedback, setPlanFeedback] = useState('');
  const [isMutatingPlan, setIsMutatingPlan] = useState(false);
  const [planRecipeOptions, setPlanRecipeOptions] = useState([]);
  const [selectedPlanRecipeId, setSelectedPlanRecipeId] = useState('');
  const [isPlanRecipeOptionsLoading, setIsPlanRecipeOptionsLoading] = useState(false);
  const [recipeDetailDraft, setRecipeDetailDraft] = useState({
    title: '',
    description: '',
    ingredients: [''],
    steps: [''],
    mainPhotoUrl: '',
  });
  const [selectedCookbookRecipeIds, setSelectedCookbookRecipeIds] = useState([]);
  const [cookbookRecipeAction, setCookbookRecipeAction] = useState(null);
  const [cookbookViewFeedback, setCookbookViewFeedback] = useState('');
  const [isMutatingCookbookView, setIsMutatingCookbookView] = useState(false);
  const [isRenamingCookbook, setIsRenamingCookbook] = useState(false);
  const [cookbookRenameInput, setCookbookRenameInput] = useState('');
  const [isCookbookToolsOpen, setIsCookbookToolsOpen] = useState(false);
  const [isMoveRecipesPickerOpen, setIsMoveRecipesPickerOpen] = useState(false);
  const ingredientInputRefs = useRef([]);
  const stepInputRefs = useRef([]);
  const tabContentOpacity = useRef(new Animated.Value(1)).current;
  const tabContentTranslateY = useRef(new Animated.Value(0)).current;
  const sheetBackdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(320)).current;

  useEffect(() => {
    if (activeTab === displayedTab) {
      return;
    }

    Animated.parallel([
      Animated.timing(tabContentOpacity, {
        toValue: 0,
        duration: 110,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(tabContentTranslateY, {
        toValue: 10,
        duration: 110,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDisplayedTab(activeTab);
      tabContentOpacity.setValue(0);
      tabContentTranslateY.setValue(10);

      Animated.parallel([
        Animated.timing(tabContentOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(tabContentTranslateY, {
          toValue: 0,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [activeTab, displayedTab, tabContentOpacity, tabContentTranslateY]);

  const loadCookbooks = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    setIsCookbooksLoading(true);
    setCookbookFeedback('');
    const { data, error } = await supabase
      .from('cookbooks')
      .select(`
        id,
        owner_user_id,
        name,
        created_at,
        cookbook_recipes(
          created_at,
          recipes(
            id,
            owner_user_id,
            name,
            description,
            main_photo_url,
            steps,
            instructions
          )
        )
      `)
      .order('created_at', { ascending: false });
    if (error) {
      setIsCookbooksLoading(false);
      setCookbookFeedback('No fue posible cargar los recetarios.');
      return null;
    }

    const normalizedCookbooks = (data || []).map((cookbook) => {
      const links = Array.isArray(cookbook.cookbook_recipes) ? cookbook.cookbook_recipes : [];
      const recipes = links
        .map((link) => {
          const recipe = Array.isArray(link.recipes) ? link.recipes[0] : link.recipes;
          return recipe && typeof recipe === 'object'
            ? {
                ...recipe,
                linked_at: link.created_at,
              }
            : null;
        })
        .filter((recipe) => recipe && typeof recipe === 'object');

      return {
        ...cookbook,
        recipeCount: recipes.length,
        recipes,
        previewRecipes: recipes.slice(0, 3),
      };
    });

    if (!userId) {
      setCookbooks(normalizedCookbooks);
      setIsCookbooksLoading(false);
      return normalizedCookbooks;
    }

    const { data: userRecipes, error: userRecipesError } = await supabase
      .from('recipes')
      .select('id, owner_user_id, name, description, main_photo_url, steps, instructions, created_at')
      .eq('owner_user_id', userId)
      .order('created_at', { ascending: false });

    if (userRecipesError) {
      setCookbooks(normalizedCookbooks);
      setIsCookbooksLoading(false);
      return normalizedCookbooks;
    }

    const recipeIds = (userRecipes || []).map((recipe) => recipe.id);
    let linkedRecipeIds = new Set();

    if (recipeIds.length > 0) {
      const { data: cookbookRecipeLinks } = await supabase
        .from('cookbook_recipes')
        .select('recipe_id')
        .in('recipe_id', recipeIds);

      linkedRecipeIds = new Set((cookbookRecipeLinks || []).map((row) => row.recipe_id));
    }

    const recipesWithoutCookbook = (userRecipes || []).filter(
      (recipe) => !linkedRecipeIds.has(recipe.id)
    );

    const listWithUnassigned =
      recipesWithoutCookbook.length > 0
        ? [
            ...normalizedCookbooks,
            {
              id: 'unassigned',
              owner_user_id: null,
              name: 'Sin Recetario',
              recipeCount: recipesWithoutCookbook.length,
              recipes: recipesWithoutCookbook,
              previewRecipes: recipesWithoutCookbook.slice(0, 3),
            },
          ]
        : normalizedCookbooks;

    setCookbooks(listWithUnassigned);
    setIsCookbooksLoading(false);
    return listWithUnassigned;
  }, [userId]);

  const loadShoppingItems = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !userId) {
      return;
    }

    setIsListLoading(true);
    setListFeedback('');
    const { data, error } = await supabase
      .from('shopping_items')
      .select('id, name, is_completed, created_at')
      .order('created_at', { ascending: true });

    setIsListLoading(false);

    if (error) {
      setListFeedback('No fue posible cargar tu lista de compras.');
      return;
    }

    setShoppingItems(data || []);
  }, [userId]);

  useEffect(() => {
    if (activeTab === 'lista') {
      loadShoppingItems();
    }
  }, [activeTab, loadShoppingItems]);

  useEffect(() => {
    if (activeTab === 'recetas') {
      loadCookbooks();
    }
  }, [activeTab, loadCookbooks]);

  const ownCookbooks = useMemo(
    () => cookbooks.filter((cookbook) => cookbook.owner_user_id === userId),
    [cookbooks, userId]
  );

  const splitRecipeDescription = (rawDescription) => {
    const description = (rawDescription || '').trim();
    if (!description) {
      return {
        descriptionText: '',
        ingredients: [],
      };
    }

    const markerRegex = /\n?\n?Ingredientes:\s*/i;
    const markerMatch = description.match(markerRegex);

    if (markerMatch) {
      const markerIndex = markerMatch.index ?? -1;
      const markerLength = markerMatch[0].length;
      const descriptionText = description.slice(0, markerIndex).trim();
      const ingredientsChunk = description.slice(markerIndex + markerLength).trim();
      const ingredients = ingredientsChunk
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      return {
        descriptionText,
        ingredients,
      };
    }

    if (description.toLowerCase().startsWith('ingredientes:')) {
      const ingredients = description
        .slice('ingredientes:'.length)
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      return {
        descriptionText: '',
        ingredients,
      };
    }

    return {
      descriptionText: description,
      ingredients: [],
    };
  };

  const normalizeRecipeSteps = (steps, instructions) => {
    if (Array.isArray(steps) && steps.length > 0) {
      return steps.map((item) => String(item || '').trim()).filter((item) => item.length > 0);
    }

    if (typeof instructions === 'string' && instructions.trim().length > 0) {
      return instructions
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    }

    return [];
  };

  const buildRecipeDetailDraft = (recipe) => {
    const { descriptionText, ingredients } = splitRecipeDescription(recipe?.description || '');
    const normalizedSteps = normalizeRecipeSteps(recipe?.steps, recipe?.instructions);

    return {
      title: recipe?.name || '',
      description: descriptionText,
      ingredients: ingredients.length > 0 ? ingredients : [''],
      steps: normalizedSteps.length > 0 ? normalizedSteps : [''],
      mainPhotoUrl: recipe?.main_photo_url || '',
    };
  };

  const findRecipeAcrossCookbooks = (cookbookList, recipeId) => {
    if (!Array.isArray(cookbookList) || !recipeId) {
      return null;
    }

    for (const cookbook of cookbookList) {
      if (!cookbook || typeof cookbook !== 'object') {
        continue;
      }

      const match = (cookbook.recipes || []).find(
        (recipe) => String(recipe.id) === String(recipeId)
      );

      if (match) {
        return match;
      }
    }

    return null;
  };

  const shoppingItemSourceSeparator = '|||__recipe__|||';

  const encodeShoppingItemName = (itemName, sourceRecipeName = '') => {
    const cleanName = String(itemName || '').trim();
    const cleanSource = String(sourceRecipeName || '').trim();

    if (!cleanSource) {
      return cleanName;
    }

    return `${cleanName}${shoppingItemSourceSeparator}${cleanSource}`;
  };

  const decodeShoppingItemName = (rawName) => {
    const normalizedName = String(rawName || '');
    const [displayNameRaw, ...sourceChunks] = normalizedName.split(shoppingItemSourceSeparator);

    return {
      displayName: displayNameRaw.trim(),
      sourceRecipeName: sourceChunks.join(shoppingItemSourceSeparator).trim(),
    };
  };

  const isUnassignedCookbookSelected = selectedCookbookForView?.id === 'unassigned';
  const canManageSelectedCookbook = Boolean(
    selectedCookbookForView &&
      (isUnassignedCookbookSelected || selectedCookbookForView.owner_user_id === userId)
  );
  const moveTargetCookbooks = useMemo(
    () =>
      ownCookbooks.filter(
        (cookbook) => String(cookbook.id) !== String(selectedCookbookForView?.id)
      ),
    [ownCookbooks, selectedCookbookForView]
  );
  const canEditSelectedRecipe = Boolean(selectedRecipeForView?.owner_user_id === userId);
  const isEditingRecipeInManualForm = Boolean(manualRecipeEditingId);
  const planMealOptions = useMemo(
    () => [
      { key: 'desayuno', label: 'Desayuno', column: 'breakfast_recipe_id' },
      { key: 'snack', label: 'Snack', column: 'snack_recipe_id' },
      { key: 'almuerzo', label: 'Almuerzo', column: 'lunch_recipe_id' },
      { key: 'cena', label: 'Cena', column: 'dinner_recipe_id' },
    ],
    []
  );

  const parseIsoDate = (isoDate) => {
    const [year, month, day] = String(isoDate || '')
      .split('-')
      .map((part) => Number(part));

    if (!year || !month || !day) {
      return null;
    }

    return new Date(year, month - 1, day);
  };

  const toIsoDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const addDaysToIsoDate = (isoDate, days) => {
    const baseDate = parseIsoDate(isoDate);
    if (!baseDate) {
      return isoDate;
    }

    const nextDate = new Date(baseDate);
    nextDate.setDate(baseDate.getDate() + days);
    return toIsoDate(nextDate);
  };

  const loadMealPlansForWeek = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !userId) {
      setMealPlansByDate({});
      setPlanRecipesById({});
      return;
    }

    const weekStart = planWeekStartIso;
    const weekEnd = addDaysToIsoDate(weekStart, 6);

    setIsPlanLoading(true);
    setPlanFeedback('');

    const { data: mealPlans, error: mealPlansError } = await supabase
      .from('meal_plans')
      .select('plan_date, breakfast_recipe_id, snack_recipe_id, lunch_recipe_id, dinner_recipe_id')
      .eq('user_id', userId)
      .gte('plan_date', weekStart)
      .lte('plan_date', weekEnd)
      .order('plan_date', { ascending: true });

    if (mealPlansError) {
      setIsPlanLoading(false);
      setPlanFeedback('No fue posible cargar el plan de comidas.');
      return;
    }

    const planMap = {};
    const recipeIds = new Set();
    (mealPlans || []).forEach((row) => {
      planMap[row.plan_date] = row;
      if (row.breakfast_recipe_id) recipeIds.add(row.breakfast_recipe_id);
      if (row.snack_recipe_id) recipeIds.add(row.snack_recipe_id);
      if (row.lunch_recipe_id) recipeIds.add(row.lunch_recipe_id);
      if (row.dinner_recipe_id) recipeIds.add(row.dinner_recipe_id);
    });

    if (recipeIds.size === 0) {
      setMealPlansByDate(planMap);
      setPlanRecipesById({});
      setIsPlanLoading(false);
      return;
    }

    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('id, name, main_photo_url')
      .in('id', [...recipeIds]);

    if (recipesError) {
      setMealPlansByDate(planMap);
      setPlanRecipesById({});
      setIsPlanLoading(false);
      setPlanFeedback('No fue posible cargar las recetas del plan.');
      return;
    }

    const recipesMap = {};
    (recipes || []).forEach((recipe) => {
      recipesMap[recipe.id] = recipe;
    });

    setMealPlansByDate(planMap);
    setPlanRecipesById(recipesMap);
    setIsPlanLoading(false);
  }, [planWeekStartIso, userId]);

  const loadPlanRecipeOptions = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !userId) {
      setPlanRecipeOptions([]);
      return [];
    }

    setIsPlanRecipeOptionsLoading(true);
    const { data, error } = await supabase
      .from('recipes')
      .select('id, name, main_photo_url, created_at')
      .eq('owner_user_id', userId)
      .order('created_at', { ascending: false });
    setIsPlanRecipeOptionsLoading(false);

    if (error) {
      setPlanRecipeOptions([]);
      return [];
    }

    setPlanRecipeOptions(data || []);
    return data || [];
  }, [userId]);

  const planWeekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const isoDate = addDaysToIsoDate(planWeekStartIso, index);
        const dateObject = parseIsoDate(isoDate);
        const planRow = mealPlansByDate[isoDate] || null;

        return {
          isoDate,
          dateObject,
          planRow,
          breakfastRecipe: planRow?.breakfast_recipe_id
            ? planRecipesById[planRow.breakfast_recipe_id] || null
            : null,
          snackRecipe: planRow?.snack_recipe_id ? planRecipesById[planRow.snack_recipe_id] || null : null,
          lunchRecipe: planRow?.lunch_recipe_id ? planRecipesById[planRow.lunch_recipe_id] || null : null,
          dinnerRecipe: planRow?.dinner_recipe_id ? planRecipesById[planRow.dinner_recipe_id] || null : null,
        };
      }),
    [mealPlansByDate, planRecipesById, planWeekStartIso]
  );

  const formattedPlanWeekRange = useMemo(() => {
    const weekStartDate = parseIsoDate(planWeekStartIso);
    if (!weekStartDate) {
      return '';
    }

    const weekEndDate = parseIsoDate(addDaysToIsoDate(planWeekStartIso, 6));
    if (!weekEndDate) {
      return '';
    }

    const startFormatter = new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
    });
    const endFormatter = new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return `${startFormatter.format(weekStartDate)} - ${endFormatter.format(weekEndDate)}`;
  }, [planWeekStartIso]);

  useEffect(() => {
    if (activeTab === 'plan') {
      loadMealPlansForWeek();
    }
  }, [activeTab, loadMealPlansForWeek]);

  const handleAddCookbook = async () => {
    const name = cookbookInput.trim();
    if (!name) {
      return;
    }

    if (!isSupabaseConfigured || !supabase || !userId) {
      setCookbookFeedback('Debes iniciar sesión para crear recetarios.');
      return;
    }

    setIsMutatingCookbooks(true);
    setCookbookFeedback('');

    const { data, error } = await supabase
      .from('cookbooks')
      .insert({
        owner_user_id: userId,
        name,
      })
      .select('id, owner_user_id, name, created_at')
      .single();

    setIsMutatingCookbooks(false);

    if (error) {
      setCookbookFeedback('No se pudo crear el recetario.');
      return;
    }

    setCookbooks((prevCookbooks) => [
      {
        ...data,
        recipeCount: 0,
        previewRecipes: [],
      },
      ...prevCookbooks,
    ]);
    setCookbookInput('');
  };

  const handleAddItem = async () => {
    const name = shoppingInput.trim();
    if (!name) {
      return;
    }

    if (!isSupabaseConfigured || !supabase || !userId) {
      setListFeedback('Supabase no está configurado.');
      return;
    }

    setIsMutatingList(true);
    setListFeedback('');

    const { data, error } = await supabase
      .from('shopping_items')
      .insert({
        user_id: userId,
        name,
      })
      .select('id, name, is_completed, created_at')
      .single();

    setIsMutatingList(false);

    if (error) {
      setListFeedback('No se pudo agregar el ítem.');
      return;
    }

    setShoppingItems((prevItems) => [...prevItems, data]);
    setShoppingInput('');
  };

  const handleToggleItem = async (item) => {
    if (!supabase) {
      return;
    }

    setIsMutatingList(true);
    setListFeedback('');

    const { error } = await supabase
      .from('shopping_items')
      .update({ is_completed: !item.is_completed })
      .eq('id', item.id);

    setIsMutatingList(false);

    if (error) {
      setListFeedback('No se pudo actualizar el ítem.');
      return;
    }

    setShoppingItems((prevItems) =>
      prevItems.map((currentItem) =>
        currentItem.id === item.id
          ? { ...currentItem, is_completed: !currentItem.is_completed }
          : currentItem
      )
    );
  };

  const handleClearCompleted = async () => {
    if (!supabase || !userId) {
      return;
    }

    setIsMutatingList(true);
    setListFeedback('');
    const { error } = await supabase
      .from('shopping_items')
      .delete()
      .eq('user_id', userId)
      .eq('is_completed', true);
    setIsMutatingList(false);

    if (error) {
      setListFeedback('No se pudieron borrar los completados.');
      return;
    }

    setShoppingItems((prevItems) => prevItems.filter((item) => !item.is_completed));
  };

  const handleClearAll = async () => {
    if (!supabase || !userId) {
      return;
    }

    setIsMutatingList(true);
    setListFeedback('');
    const { error } = await supabase.from('shopping_items').delete().eq('user_id', userId);
    setIsMutatingList(false);

    if (error) {
      setListFeedback('No se pudo borrar la lista completa.');
      return;
    }

    setShoppingItems([]);
  };

  const completedCount = shoppingItems.filter((item) => item.is_completed).length;
  const canClearCompleted = completedCount > 0;
  const canClearAll = shoppingItems.length > 0;

  const renderRecipeDetailView = () => {
    return (
      <View>
        <View style={styles.recipeDetailTopRow}>
          <TouchableOpacity style={styles.cookbookBackAction} onPress={closeRecipeDetailView}>
            <Ionicons name="chevron-back" size={18} color={palette.accent} />
            <Text style={styles.cookbookBackActionText}>{selectedCookbookForView?.name || 'Recetas'}</Text>
          </TouchableOpacity>

          {canEditSelectedRecipe ? (
            <TouchableOpacity
              style={styles.recipeDetailEditButton}
              onPress={handleOpenManualRecipeEditForm}
            >
              <Text style={styles.recipeDetailEditButtonText}>Editar</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.recipeDetailHero}>
          <View style={styles.recipeDetailHeroTouchable}>
            {recipeDetailDraft.mainPhotoUrl ? (
              <Image
                source={{ uri: recipeDetailDraft.mainPhotoUrl }}
                style={styles.recipeDetailHeroImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.recipeDetailHeroPlaceholder}>
                <Ionicons name="image-outline" size={34} color={palette.accent} />
              </View>
            )}
          </View>
        </View>

        <View style={styles.recipeDetailTitleBar}>
          <Text style={styles.recipeDetailTitleText}>{recipeDetailDraft.title || 'Sin título'}</Text>
        </View>

        <View style={styles.recipeDetailBody}>
          <View style={styles.manualQuickActionsRow}>
            <TouchableOpacity
              style={styles.manualQuickAction}
              onPress={handleOpenRecipeCookbookPicker}
            >
              <View style={styles.manualQuickActionIcon}>
                <Ionicons name="book-outline" size={20} color={palette.accent} />
              </View>
              <Text style={styles.manualQuickActionText}>Recetarios</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.manualQuickAction}
              onPress={handleOpenPlanFromRecipeDetail}
            >
              <View style={styles.manualQuickActionIcon}>
                <Ionicons name="calendar-outline" size={20} color={palette.accent} />
              </View>
              <Text style={styles.manualQuickActionText}>Plan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.manualQuickAction}
              onPress={handleOpenRecipeListPicker}
            >
              <View style={styles.manualQuickActionIcon}>
                <Ionicons name="checkbox-outline" size={20} color={palette.accent} />
              </View>
              <Text style={styles.manualQuickActionText}>Lista</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.manualQuickAction}
              onPress={() => setRecipeDetailFeedback('Compartir estará disponible pronto.')}
            >
              <View style={styles.manualQuickActionIcon}>
                <Ionicons name="share-social-outline" size={20} color={palette.accent} />
              </View>
              <Text style={styles.manualQuickActionText}>Compartir</Text>
            </TouchableOpacity>
          </View>

          {recipeDetailDraft.description ? (
            <View style={styles.recipeDetailDescriptionWrap}>
              <Text style={styles.recipeDetailDescription}>{recipeDetailDraft.description}</Text>
            </View>
          ) : null}

          <Text style={styles.manualSectionTitle}>Ingredientes</Text>
          {recipeDetailDraft.ingredients.map((item, index) => (
            <View key={`detail-ingredient-${index}`} style={styles.manualListRow}>
              <Text style={styles.recipeDetailBullet}>•</Text>
              <Text style={styles.recipeDetailReadText}>{item || '-'}</Text>
            </View>
          ))}

          <Text style={[styles.manualSectionTitle, styles.manualSectionSpacing]}>Preparación</Text>
          {recipeDetailDraft.steps.map((item, index) => (
            <View key={`detail-step-${index}`} style={styles.manualListRow}>
              <Text style={styles.manualStepNumber}>{index + 1}.</Text>
              <Text style={styles.recipeDetailReadText}>{item || '-'}</Text>
            </View>
          ))}

          {recipeDetailFeedback ? <Text style={styles.feedback}>{recipeDetailFeedback}</Text> : null}
        </View>
      </View>
    );
  };

  const renderCookbookRecipesView = () => {
    const totalRecipes = selectedCookbookForView?.recipeCount || 0;
    const isSelectionActive = Boolean(cookbookRecipeAction);
    const selectedCount = selectedCookbookRecipeIds.length;
    const activeActionLabel =
      cookbookRecipeAction === 'move'
        ? 'Mover'
        : cookbookRecipeAction === 'detach'
        ? 'Remover'
        : cookbookRecipeAction === 'delete'
        ? 'Eliminar'
        : '';

    return (
      <View>
        <TouchableOpacity style={styles.cookbookBackAction} onPress={closeCookbookRecipesView}>
          <Ionicons name="chevron-back" size={18} color={palette.accent} />
          <Text style={styles.cookbookBackActionText}>Recetarios</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{selectedCookbookForView?.name || 'Recetas'}</Text>
        <Text style={styles.body}>
          {totalRecipes === 1 ? '1 receta en este recetario.' : `${totalRecipes} recetas en este recetario.`}
        </Text>

        {canManageSelectedCookbook ? (
          <View style={styles.cookbookOrganizeWrap}>
            <TouchableOpacity
              style={[
                styles.cookbookOrganizeButton,
                (isSelectionActive || isMutatingCookbookView) && styles.buttonDisabled,
              ]}
              onPress={() => setIsCookbookToolsOpen((prevState) => !prevState)}
              disabled={isSelectionActive || isMutatingCookbookView}
            >
              <Ionicons
                name={isCookbookToolsOpen ? 'close-outline' : 'options-outline'}
                size={18}
                color={palette.accent}
              />
              <Text style={styles.cookbookOrganizeButtonText}>Organizar</Text>
            </TouchableOpacity>

            {isRenamingCookbook ? (
              <View style={styles.cookbookRenameRow}>
                <TextInput
                  style={styles.cookbookRenameInput}
                  value={cookbookRenameInput}
                  onChangeText={setCookbookRenameInput}
                  placeholder="Nuevo nombre del recetario"
                  placeholderTextColor={palette.mutedText}
                  editable={!isMutatingCookbookView}
                />
                <View style={styles.cookbookRenameActions}>
                  <TouchableOpacity
                    style={[styles.secondaryAction, isMutatingCookbookView && styles.buttonDisabled]}
                    onPress={handleRenameSelectedCookbook}
                    disabled={isMutatingCookbookView}
                  >
                    <Text style={styles.secondaryActionText}>Guardar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.secondaryAction, isMutatingCookbookView && styles.buttonDisabled]}
                    onPress={() => {
                      setIsRenamingCookbook(false);
                      setCookbookRenameInput(selectedCookbookForView?.name || '');
                    }}
                    disabled={isMutatingCookbookView}
                  >
                    <Text style={styles.secondaryActionText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {isCookbookToolsOpen && !isSelectionActive && !isRenamingCookbook ? (
              <View style={styles.cookbookToolsRow}>
                {!isUnassignedCookbookSelected ? (
                  <TouchableOpacity
                    style={styles.cookbookToolButton}
                    onPress={() => {
                      setIsRenamingCookbook(true);
                      setCookbookRenameInput(selectedCookbookForView?.name || '');
                    }}
                  >
                    <View style={styles.cookbookToolIconWrap}>
                      <Ionicons name="create-outline" size={18} color={palette.accent} />
                    </View>
                    <Text style={styles.cookbookToolLabel}>Renombrar</Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity style={styles.cookbookToolButton} onPress={() => startCookbookRecipeAction('move')}>
                  <View style={styles.cookbookToolIconWrap}>
                    <Ionicons name="swap-horizontal-outline" size={18} color={palette.accent} />
                  </View>
                  <Text style={styles.cookbookToolLabel}>Mover</Text>
                </TouchableOpacity>

                {!isUnassignedCookbookSelected ? (
                  <TouchableOpacity style={styles.cookbookToolButton} onPress={() => startCookbookRecipeAction('detach')}>
                    <View style={styles.cookbookToolIconWrap}>
                      <Ionicons name="remove-circle-outline" size={18} color={palette.accent} />
                    </View>
                    <Text style={styles.cookbookToolLabel}>Remover</Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity style={styles.cookbookToolButton} onPress={() => startCookbookRecipeAction('delete')}>
                  <View style={styles.cookbookToolIconWrap}>
                    <Ionicons name="trash-outline" size={18} color={palette.accent} />
                  </View>
                  <Text style={styles.cookbookToolLabel}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ) : null}

        {canManageSelectedCookbook && isSelectionActive ? (
          <View style={styles.cookbookSelectionPanelCompact}>
            <Text style={styles.cookbookSelectionText}>
              {selectedCount} seleccionada{selectedCount === 1 ? '' : 's'} · {activeActionLabel}
            </Text>
            <View style={styles.cookbookSelectionCompactActions}>
              {cookbookRecipeAction === 'move' ? (
                <TouchableOpacity
                  style={[styles.secondaryAction, isMutatingCookbookView && styles.buttonDisabled]}
                  onPress={() => setIsMoveRecipesPickerOpen(true)}
                  disabled={isMutatingCookbookView}
                >
                  <Text style={styles.secondaryActionText}>Elegir destino</Text>
                </TouchableOpacity>
              ) : null}

              {cookbookRecipeAction === 'detach' ? (
                <TouchableOpacity
                  style={[styles.secondaryAction, isMutatingCookbookView && styles.buttonDisabled]}
                  onPress={handleRemoveRecipesFromCookbook}
                  disabled={isMutatingCookbookView}
                >
                  <Text style={styles.secondaryActionText}>Aplicar</Text>
                </TouchableOpacity>
              ) : null}

              {cookbookRecipeAction === 'delete' ? (
                <TouchableOpacity
                  style={[styles.secondaryAction, isMutatingCookbookView && styles.buttonDisabled]}
                  onPress={handleDeleteSelectedRecipes}
                  disabled={isMutatingCookbookView}
                >
                  <Text style={styles.secondaryActionText}>Aplicar</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={[styles.cookbookCompactCancelButton, isMutatingCookbookView && styles.buttonDisabled]}
                onPress={cancelCookbookRecipeAction}
                disabled={isMutatingCookbookView}
              >
                <Ionicons name="close" size={18} color={palette.accent} />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {cookbookViewFeedback ? <Text style={styles.feedback}>{cookbookViewFeedback}</Text> : null}

        {selectedCookbookForView?.recipes?.length ? (
          <View style={styles.cookbookRecipesScreenList}>
            {selectedCookbookForView.recipes.map((recipe) => (
              <TouchableOpacity
                key={`cookbook-recipe-${selectedCookbookForView.id}-${recipe.id}`}
                style={[
                  styles.cookbookRecipeItem,
                  isSelectionActive &&
                    selectedCookbookRecipeIds.includes(recipe.id) &&
                    styles.cookbookRecipeItemSelected,
                ]}
                onPress={() => {
                  if (isSelectionActive && canManageSelectedCookbook) {
                    toggleCookbookRecipeSelection(recipe.id);
                    return;
                  }

                  handleOpenRecipeDetail(recipe);
                }}
                activeOpacity={isSelectionActive ? 0.8 : 1}
              >
                <View style={styles.cookbookRecipeThumb}>
                  {recipe.main_photo_url ? (
                    <Image
                      source={{ uri: recipe.main_photo_url }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.previewPlaceholder}>
                      <Ionicons name="restaurant-outline" size={16} color={palette.accent} />
                    </View>
                  )}
                </View>
                {isSelectionActive ? (
                  <Ionicons
                    name={selectedCookbookRecipeIds.includes(recipe.id) ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={selectedCookbookRecipeIds.includes(recipe.id) ? palette.button : '#8B9AAA'}
                    style={styles.cookbookRecipeSelectIcon}
                  />
                ) : null}
                <Text style={styles.cookbookRecipeName}>{recipe.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>Este recetario aún no tiene recetas.</Text>
        )}
      </View>
    );
  };

  const renderRecetasView = () => (
    <View>
      {selectedCookbookForView ? (
        renderCookbookRecipesView()
      ) : (
        <>
      <Text style={styles.title}>Recetarios</Text>
      <Text style={styles.body}>
        Estos recetarios son públicos. Puedes crear uno nuevo y luego agregar recetas.
      </Text>

      {!isSupabaseConfigured ? (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            Configura `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` para usar recetarios.
          </Text>
        </View>
      ) : null}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Nombre del recetario"
          placeholderTextColor={palette.mutedText}
          value={cookbookInput}
          onChangeText={setCookbookInput}
          editable={!isMutatingCookbooks}
          onSubmitEditing={handleAddCookbook}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.addButton, (isMutatingCookbooks || !cookbookInput.trim()) && styles.buttonDisabled]}
          onPress={handleAddCookbook}
          disabled={isMutatingCookbooks || !cookbookInput.trim()}
        >
          <Ionicons name="add" size={20} color={palette.card} />
        </TouchableOpacity>
      </View>

      {cookbookFeedback ? <Text style={styles.feedback}>{cookbookFeedback}</Text> : null}

      {isCookbooksLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={palette.accent} />
        </View>
      ) : (
        <View style={styles.cookbooksList}>
          {cookbooks.length === 0 ? (
            <Text style={styles.emptyText}>Aún no hay recetarios creados.</Text>
          ) : (
            cookbooks.map((cookbook) => (
              <TouchableOpacity
                key={cookbook.id}
                style={styles.cookbookCard}
                activeOpacity={0.85}
                onPress={() => handleOpenCookbookRecipes(cookbook)}
              >
                <View style={styles.cookbookPreview}>
                  <View style={styles.previewLeft}>
                    {cookbook.previewRecipes?.[0]?.main_photo_url ? (
                      <Image
                        source={{ uri: cookbook.previewRecipes[0].main_photo_url }}
                        style={styles.previewImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.previewPlaceholder}>
                        <Ionicons name="restaurant-outline" size={20} color={palette.accent} />
                      </View>
                    )}
                  </View>

                  <View style={styles.previewRight}>
                    <View style={styles.previewRightTop}>
                      {cookbook.previewRecipes?.[1]?.main_photo_url ? (
                        <Image
                          source={{ uri: cookbook.previewRecipes[1].main_photo_url }}
                          style={styles.previewImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.previewPlaceholder}>
                          <Ionicons name="image-outline" size={18} color={palette.accent} />
                        </View>
                      )}
                    </View>

                    <View style={styles.previewRightBottom}>
                      {cookbook.previewRecipes?.[2]?.main_photo_url ? (
                        <Image
                          source={{ uri: cookbook.previewRecipes[2].main_photo_url }}
                          style={styles.previewImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.previewPlaceholder}>
                          <Ionicons name="image-outline" size={18} color={palette.accent} />
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <Text style={styles.cookbookTitle}>{cookbook.name}</Text>
                <Text style={styles.cookbookCount}>
                  {cookbook.recipeCount || 0} {(cookbook.recipeCount || 0) === 1 ? 'receta' : 'recetas'}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
        </>
      )}
    </View>
  );

  const renderListaView = () => (
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

  const renderPlanView = () => {
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
  };

  const renderGeneralView = (title, body) => (
    <View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <View style={styles.placeholderCard}>
        <Text style={styles.placeholderTitle}>Contenido</Text>
        <Text style={styles.placeholderBody}>Placeholder para modulo de {title}.</Text>
      </View>
    </View>
  );

  const openCreateRecipeSheet = () => {
    setIsCreateRecipeSheetOpen(true);
    sheetBackdropOpacity.setValue(0);
    sheetTranslateY.setValue(320);

    Animated.parallel([
      Animated.timing(sheetBackdropOpacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeCreateRecipeSheet = (onClosed) => {
    Animated.parallel([
      Animated.timing(sheetBackdropOpacity, {
        toValue: 0,
        duration: 140,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 320,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsCreateRecipeSheetOpen(false);
      if (typeof onClosed === 'function') {
        onClosed();
      }
    });
  };

  const handleOpenBrowserImport = () => {
    closeCreateRecipeSheet(() => {
      setImportFeedback('');
      setImportUrl('');
      setIsImportUrlModalOpen(true);
    });
  };

  const resetManualRecipeForm = () => {
    setManualRecipeEditingId(null);
    setManualRecipeTitle('');
    setManualMainPhotoUrl('');
    setManualRecipeDescription('');
    setManualIngredients(['']);
    setManualSteps(['']);
    setSelectedCookbookIds([]);
    setManualRecipeFeedback('');
  };

  const closeManualRecipeForm = () => {
    closePlanAssignModal();
    setIsCookbookPickerOpen(false);
    setIsManualRecipeModalOpen(false);
    resetManualRecipeForm();
  };

  const handleOpenManualRecipeForm = () => {
    closeCreateRecipeSheet(() => {
      resetManualRecipeForm();
      setIsManualRecipeModalOpen(true);
    });
  };

  const handleOpenManualRecipeEditForm = async () => {
    if (!selectedRecipeForView || !canEditSelectedRecipe) {
      return;
    }

    const { descriptionText, ingredients } = splitRecipeDescription(selectedRecipeForView.description || '');
    const cleanSteps = normalizeRecipeSteps(selectedRecipeForView.steps, selectedRecipeForView.instructions);
    const refreshedCookbooks = await loadCookbooks();
    const sourceOwnCookbooks = Array.isArray(refreshedCookbooks)
      ? refreshedCookbooks.filter((cookbook) => cookbook.owner_user_id === userId)
      : ownCookbooks;

    setManualRecipeEditingId(selectedRecipeForView.id);
    setManualRecipeTitle(selectedRecipeForView.name || '');
    setManualMainPhotoUrl(selectedRecipeForView.main_photo_url || '');
    setManualRecipeDescription(descriptionText);
    setManualIngredients(ingredients.length > 0 ? ingredients : ['']);
    setManualSteps(cleanSteps.length > 0 ? cleanSteps : ['']);
    setSelectedCookbookIds(
      sourceOwnCookbooks
        .filter((cookbook) =>
          (cookbook.recipes || []).some((recipe) => String(recipe.id) === String(selectedRecipeForView.id))
        )
        .map((cookbook) => cookbook.id)
    );
    setManualRecipeFeedback('');
    setIsManualRecipeModalOpen(true);
  };

  const handleManualQuickAccess = (tabKey) => {
    closeManualRecipeForm();
    setActiveTab(tabKey);
  };

  const handleOpenCookbookPicker = () => {
    loadCookbooks();
    setIsCookbookPickerOpen(true);
  };

  const toggleCookbookSelection = (cookbookId) => {
    setSelectedCookbookIds((prevIds) =>
      prevIds.includes(cookbookId)
        ? prevIds.filter((currentCookbookId) => currentCookbookId !== cookbookId)
        : [...prevIds, cookbookId]
    );
  };

  const closeCookbookRecipesView = () => {
    closePlanAssignModal();
    setSelectedCookbookForView(null);
    setSelectedRecipeForView(null);
    setRecipeDetailMode('view');
    setRecipeDetailFeedback('');
    setIsSavingRecipeDetail(false);
    setIsRecipeCookbookPickerOpen(false);
    setRecipeCookbookSelectionIds([]);
    setIsSavingRecipeCookbookSelection(false);
    setIsRecipeListPickerOpen(false);
    setRecipeListIngredients([]);
    setSelectedRecipeListIngredientKeys([]);
    setIsAddingRecipeIngredientsToList(false);
    setSelectedCookbookRecipeIds([]);
    setCookbookRecipeAction(null);
    setCookbookViewFeedback('');
    setIsRenamingCookbook(false);
    setCookbookRenameInput('');
    setIsCookbookToolsOpen(false);
    setIsMoveRecipesPickerOpen(false);
  };

  const refreshCookbooksAndSelectedCookbook = async (cookbookIdToKeep) => {
    const refreshedCookbooks = await loadCookbooks();
    if (!cookbookIdToKeep) {
      return null;
    }

    if (!Array.isArray(refreshedCookbooks)) {
      return null;
    }

    const updatedCookbook = refreshedCookbooks.find(
      (cookbook) => String(cookbook.id) === String(cookbookIdToKeep)
    );

    if (!updatedCookbook) {
      closeCookbookRecipesView();
      return null;
    }

    setSelectedCookbookForView(updatedCookbook);
    setCookbookRenameInput(updatedCookbook.name || '');
    return updatedCookbook;
  };

  const handleOpenCookbookRecipes = (cookbook) => {
    setSelectedCookbookForView(cookbook);
    setSelectedRecipeForView(null);
    setRecipeDetailMode('view');
    setRecipeDetailFeedback('');
    setSelectedCookbookRecipeIds([]);
    setCookbookRecipeAction(null);
    setCookbookViewFeedback('');
    setIsRenamingCookbook(false);
    setCookbookRenameInput(cookbook?.name || '');
    setIsCookbookToolsOpen(false);
    setIsMoveRecipesPickerOpen(false);
  };

  const closeRecipeDetailView = () => {
    closePlanAssignModal();
    setSelectedRecipeForView(null);
    setRecipeDetailMode('view');
    setRecipeDetailFeedback('');
    setIsSavingRecipeDetail(false);
    setIsRecipeCookbookPickerOpen(false);
    setRecipeCookbookSelectionIds([]);
    setIsSavingRecipeCookbookSelection(false);
    setIsRecipeListPickerOpen(false);
    setRecipeListIngredients([]);
    setSelectedRecipeListIngredientKeys([]);
    setIsAddingRecipeIngredientsToList(false);
  };

  const handleOpenRecipeDetail = (recipe) => {
    setSelectedRecipeForView(recipe);
    setRecipeDetailMode('view');
    setRecipeDetailFeedback('');
    setRecipeDetailDraft(buildRecipeDetailDraft(recipe));
  };

  const updateRecipeDraftIngredient = (targetIndex, value) => {
    setRecipeDetailDraft((prevDraft) => ({
      ...prevDraft,
      ingredients: prevDraft.ingredients.map((item, index) => (index === targetIndex ? value : item)),
    }));
  };

  const addRecipeDraftIngredient = () => {
    setRecipeDetailDraft((prevDraft) => ({
      ...prevDraft,
      ingredients: [...prevDraft.ingredients, ''],
    }));
  };

  const removeRecipeDraftIngredient = (targetIndex) => {
    setRecipeDetailDraft((prevDraft) => {
      const nextIngredients = prevDraft.ingredients.filter((_, index) => index !== targetIndex);
      return {
        ...prevDraft,
        ingredients: nextIngredients.length > 0 ? nextIngredients : [''],
      };
    });
  };

  const updateRecipeDraftStep = (targetIndex, value) => {
    setRecipeDetailDraft((prevDraft) => ({
      ...prevDraft,
      steps: prevDraft.steps.map((item, index) => (index === targetIndex ? value : item)),
    }));
  };

  const addRecipeDraftStep = () => {
    setRecipeDetailDraft((prevDraft) => ({
      ...prevDraft,
      steps: [...prevDraft.steps, ''],
    }));
  };

  const removeRecipeDraftStep = (targetIndex) => {
    setRecipeDetailDraft((prevDraft) => {
      const nextSteps = prevDraft.steps.filter((_, index) => index !== targetIndex);
      return {
        ...prevDraft,
        steps: nextSteps.length > 0 ? nextSteps : [''],
      };
    });
  };

  const composeRecipeDescription = (description, ingredients) => {
    const cleanDescription = (description || '').trim();
    const cleanIngredients = (ingredients || [])
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (!cleanDescription && cleanIngredients.length === 0) {
      return '';
    }

    if (cleanDescription && cleanIngredients.length > 0) {
      return `${cleanDescription}\n\nIngredientes: ${cleanIngredients.join(', ')}`;
    }

    if (cleanIngredients.length > 0) {
      return `Ingredientes: ${cleanIngredients.join(', ')}`;
    }

    return cleanDescription;
  };

  const handleSaveRecipeDetail = async () => {
    if (!supabase || !isSupabaseConfigured || !selectedRecipeForView || !canEditSelectedRecipe) {
      return;
    }

    const name = recipeDetailDraft.title.trim();
    if (!name) {
      setRecipeDetailFeedback('El título es obligatorio.');
      return;
    }

    const cleanSteps = recipeDetailDraft.steps
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    const descriptionToSave = composeRecipeDescription(
      recipeDetailDraft.description,
      recipeDetailDraft.ingredients
    );

    setIsSavingRecipeDetail(true);
    setRecipeDetailFeedback('');
    const { error } = await supabase
      .from('recipes')
      .update({
        name,
        description: descriptionToSave,
        main_photo_url: recipeDetailDraft.mainPhotoUrl || null,
        steps: cleanSteps,
        instructions: cleanSteps.join('\n'),
      })
      .eq('id', selectedRecipeForView.id)
      .eq('owner_user_id', userId);
    setIsSavingRecipeDetail(false);

    if (error) {
      setRecipeDetailFeedback('No se pudo actualizar la receta.');
      return;
    }

    const updatedCookbook = await refreshCookbooksAndSelectedCookbook(selectedCookbookForView?.id);
    if (updatedCookbook) {
      const refreshedRecipe = (updatedCookbook.recipes || []).find(
        (recipe) => String(recipe.id) === String(selectedRecipeForView.id)
      );

      if (refreshedRecipe) {
        setSelectedRecipeForView(refreshedRecipe);
        setRecipeDetailDraft(buildRecipeDetailDraft(refreshedRecipe));
      }
    }

    setRecipeDetailMode('view');
    setRecipeDetailFeedback('Receta actualizada correctamente.');
  };

  const toggleCookbookRecipeSelection = (recipeId) => {
    setSelectedCookbookRecipeIds((prevRecipeIds) =>
      prevRecipeIds.includes(recipeId)
        ? prevRecipeIds.filter((currentId) => currentId !== recipeId)
        : [...prevRecipeIds, recipeId]
    );
  };

  const startCookbookRecipeAction = (action) => {
    if (!selectedCookbookForView?.recipes?.length) {
      setCookbookViewFeedback('No hay recetas para seleccionar.');
      return;
    }

    setCookbookRecipeAction(action);
    setSelectedCookbookRecipeIds([]);
    setCookbookViewFeedback('');
    setIsCookbookToolsOpen(false);
    setIsRenamingCookbook(false);
    setIsMoveRecipesPickerOpen(false);
  };

  const cancelCookbookRecipeAction = () => {
    setCookbookRecipeAction(null);
    setSelectedCookbookRecipeIds([]);
    setIsCookbookToolsOpen(false);
    setIsMoveRecipesPickerOpen(false);
  };

  const handleRenameSelectedCookbook = async () => {
    if (!supabase || !selectedCookbookForView || !canManageSelectedCookbook || isUnassignedCookbookSelected) {
      return;
    }

    const nextName = cookbookRenameInput.trim();
    if (!nextName) {
      setCookbookViewFeedback('El nombre del recetario no puede estar vacío.');
      return;
    }

    setIsMutatingCookbookView(true);
    setCookbookViewFeedback('');
    const { error } = await supabase
      .from('cookbooks')
      .update({ name: nextName })
      .eq('id', selectedCookbookForView.id)
      .eq('owner_user_id', userId);
    setIsMutatingCookbookView(false);

    if (error) {
      setCookbookViewFeedback('No se pudo renombrar el recetario.');
      return;
    }

    await refreshCookbooksAndSelectedCookbook(selectedCookbookForView.id);
    setCookbookViewFeedback('Recetario renombrado correctamente.');
    setIsRenamingCookbook(false);
    setIsCookbookToolsOpen(false);
  };

  const handleRemoveRecipesFromCookbook = async () => {
    if (!supabase || !selectedCookbookForView || !canManageSelectedCookbook || isUnassignedCookbookSelected) {
      return;
    }

    if (selectedCookbookRecipeIds.length === 0) {
      setCookbookViewFeedback('Selecciona al menos una receta.');
      return;
    }

    setIsMutatingCookbookView(true);
    setCookbookViewFeedback('');
    const { error } = await supabase
      .from('cookbook_recipes')
      .delete()
      .in('recipe_id', selectedCookbookRecipeIds);
    setIsMutatingCookbookView(false);

    if (error) {
      setCookbookViewFeedback('No se pudieron remover las recetas del recetario.');
      return;
    }

    await refreshCookbooksAndSelectedCookbook(selectedCookbookForView.id);
    cancelCookbookRecipeAction();
    setCookbookViewFeedback('Recetas movidas a Sin Recetario.');
  };

  const handleDeleteSelectedRecipes = async () => {
    if (!supabase || !selectedCookbookForView || !canManageSelectedCookbook) {
      return;
    }

    if (selectedCookbookRecipeIds.length === 0) {
      setCookbookViewFeedback('Selecciona al menos una receta.');
      return;
    }

    setIsMutatingCookbookView(true);
    setCookbookViewFeedback('');
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('owner_user_id', userId)
      .in('id', selectedCookbookRecipeIds);
    setIsMutatingCookbookView(false);

    if (error) {
      setCookbookViewFeedback('No se pudieron eliminar las recetas.');
      return;
    }

    await refreshCookbooksAndSelectedCookbook(selectedCookbookForView.id);
    cancelCookbookRecipeAction();
    setCookbookViewFeedback('Recetas eliminadas correctamente.');
  };

  const handleMoveSelectedRecipesToCookbook = async (targetCookbookId) => {
    if (!supabase || !selectedCookbookForView || !canManageSelectedCookbook) {
      return;
    }

    if (selectedCookbookRecipeIds.length === 0) {
      setCookbookViewFeedback('Selecciona al menos una receta.');
      return;
    }

    if (!targetCookbookId) {
      setCookbookViewFeedback('Selecciona un recetario destino.');
      return;
    }

    setIsMutatingCookbookView(true);
    setCookbookViewFeedback('');

    const targetRows = selectedCookbookRecipeIds.map((recipeId) => ({
      cookbook_id: targetCookbookId,
      recipe_id: recipeId,
    }));

    const { error: insertError } = await supabase
      .from('cookbook_recipes')
      .upsert(targetRows, { onConflict: 'cookbook_id,recipe_id', ignoreDuplicates: true });

    if (insertError) {
      setIsMutatingCookbookView(false);
      setCookbookViewFeedback('No se pudieron mover las recetas.');
      return;
    }

    if (!isUnassignedCookbookSelected) {
      const { error: deleteError } = await supabase
        .from('cookbook_recipes')
        .delete()
        .eq('cookbook_id', selectedCookbookForView.id)
        .in('recipe_id', selectedCookbookRecipeIds);

      if (deleteError) {
        setIsMutatingCookbookView(false);
        setCookbookViewFeedback('Recetas copiadas, pero no se pudieron remover del recetario original.');
        return;
      }
    }

    setIsMutatingCookbookView(false);
    await refreshCookbooksAndSelectedCookbook(selectedCookbookForView.id);
    cancelCookbookRecipeAction();
    setCookbookViewFeedback('Recetas movidas correctamente.');
  };

  const handlePickManualPhoto = async () => {
    if (Platform.OS !== 'web') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        setManualRecipeFeedback('Debes permitir acceso a tus fotos para agregar imagen.');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.65,
      base64: true,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const selectedAsset = result.assets[0];
    const mimeType = selectedAsset.mimeType || 'image/jpeg';
    const photoUrl = selectedAsset.base64
      ? `data:${mimeType};base64,${selectedAsset.base64}`
      : selectedAsset.uri;

    setManualMainPhotoUrl(photoUrl);
    setManualRecipeFeedback('');
  };

  const handlePickRecipeDetailPhoto = async () => {
    if (!canEditSelectedRecipe || recipeDetailMode !== 'edit') {
      return;
    }

    if (Platform.OS !== 'web') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        setRecipeDetailFeedback('Debes permitir acceso a tus fotos para agregar imagen.');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.65,
      base64: true,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const selectedAsset = result.assets[0];
    const mimeType = selectedAsset.mimeType || 'image/jpeg';
    const photoUrl = selectedAsset.base64
      ? `data:${mimeType};base64,${selectedAsset.base64}`
      : selectedAsset.uri;

    setRecipeDetailDraft((prevDraft) => ({
      ...prevDraft,
      mainPhotoUrl: photoUrl,
    }));
    setRecipeDetailFeedback('');
  };

  const getTodayDateString = () => toIsoDate(new Date());

  const closePlanAssignModal = () => {
    if (isSavingPlanAssignment) {
      return;
    }

    setIsPlanAssignModalOpen(false);
    setPlanAssignmentRecipe(null);
    setPlanAssignDate('');
    setPlanAssignMealType('almuerzo');
    setPlanAssignFeedback('');
    setSelectedPlanRecipeId('');
  };

  const openPlanAssignModalForRecipe = async (recipe, dateOverride, mealTypeOverride = 'almuerzo') => {
    if (!recipe?.id && !dateOverride) {
      return;
    }

    const selectedDate = dateOverride || getTodayDateString();
    setPlanAssignDate(selectedDate);
    setPlanAssignMealType(mealTypeOverride);
    setPlanAssignFeedback('');
    setSelectedPlanRecipeId('');

    if (recipe?.id) {
      setPlanAssignmentRecipe({
        id: recipe.id,
        name: recipe.name || 'Receta',
      });
      setSelectedPlanRecipeId(String(recipe.id));
    } else {
      setPlanAssignmentRecipe(null);
      const recipes = await loadPlanRecipeOptions();
      if (recipes.length > 0) {
        setSelectedPlanRecipeId(String(recipes[0].id));
      }
    }

    setIsPlanAssignModalOpen(true);
  };

  const handleOpenPlanFromRecipeDetail = () => {
    if (!selectedRecipeForView) {
      return;
    }

    openPlanAssignModalForRecipe({
      id: selectedRecipeForView.id,
      name: selectedRecipeForView.name || recipeDetailDraft.title || 'Receta',
    });
  };

  const handleOpenPlanFromManualForm = () => {
    if (!manualRecipeEditingId) {
      setManualRecipeFeedback('Guarda la receta primero para poder planificarla.');
      return;
    }

    openPlanAssignModalForRecipe({
      id: manualRecipeEditingId,
      name: manualRecipeTitle.trim() || selectedRecipeForView?.name || 'Receta',
    });
  };

  const handleOpenPlanAssignForDay = async (isoDate) => {
    await openPlanAssignModalForRecipe(null, isoDate);
  };

  const handleOpenPlanAssignForDayMeal = async (isoDate, mealType) => {
    await openPlanAssignModalForRecipe(null, isoDate, mealType);
  };

  const shiftPlanWeek = (weekOffset) => {
    setPlanWeekStartIso((currentWeekStart) => addDaysToIsoDate(currentWeekStart, weekOffset * 7));
  };

  const handleOpenPlanRecipeDetail = async (recipeId) => {
    if (!recipeId) {
      return;
    }

    if (!supabase || !isSupabaseConfigured) {
      const fallbackRecipe = planRecipesById[recipeId];
      if (fallbackRecipe) {
        setSelectedCookbookForView(null);
        handleOpenRecipeDetail({
          ...fallbackRecipe,
          description: '',
          steps: [],
          instructions: '',
        });
      }
      return;
    }

    setPlanFeedback('');
    const { data, error } = await supabase
      .from('recipes')
      .select('id, owner_user_id, name, description, main_photo_url, steps, instructions')
      .eq('id', recipeId)
      .single();

    if (error || !data) {
      setPlanFeedback('No se pudo abrir la receta desde el plan.');
      return;
    }

    setSelectedCookbookForView(null);
    handleOpenRecipeDetail(data);
  };

  const handleRemoveRecipeFromPlanSlot = async (isoDate, mealType) => {
    if (!supabase || !isSupabaseConfigured || !userId) {
      setPlanFeedback('Debes iniciar sesión y configurar Supabase para actualizar el plan.');
      return;
    }

    const selectedMealOption = planMealOptions.find((option) => option.key === mealType);
    if (!selectedMealOption) {
      return;
    }

    setIsMutatingPlan(true);
    setPlanFeedback('');
    const { error } = await supabase
      .from('meal_plans')
      .update({ [selectedMealOption.column]: null })
      .eq('user_id', userId)
      .eq('plan_date', isoDate);
    setIsMutatingPlan(false);

    if (error) {
      setPlanFeedback('No se pudo remover la receta del plan.');
      return;
    }

    await loadMealPlansForWeek();
    setPlanFeedback(`Receta removida de ${selectedMealOption.label.toLowerCase()}.`);
  };

  const getRecipeMembershipInOwnCookbooks = (recipeId) =>
    ownCookbooks
      .filter((cookbook) =>
        (cookbook.recipes || []).some((recipe) => String(recipe.id) === String(recipeId))
      )
      .map((cookbook) => cookbook.id);

  const handleOpenRecipeCookbookPicker = () => {
    if (!selectedRecipeForView) {
      return;
    }

    if (!canEditSelectedRecipe) {
      setRecipeDetailFeedback('Solo puedes modificar recetarios en tus recetas.');
      return;
    }

    const membershipIds = getRecipeMembershipInOwnCookbooks(selectedRecipeForView.id);
    setRecipeCookbookSelectionIds(membershipIds);
    setIsRecipeCookbookPickerOpen(true);
  };

  const toggleRecipeCookbookSelection = (cookbookId) => {
    setRecipeCookbookSelectionIds((prevCookbookIds) =>
      prevCookbookIds.includes(cookbookId)
        ? prevCookbookIds.filter((currentId) => currentId !== cookbookId)
        : [...prevCookbookIds, cookbookId]
    );
  };

  const handleSaveRecipeCookbookSelection = async () => {
    if (!supabase || !selectedRecipeForView || !canEditSelectedRecipe) {
      return;
    }

    const currentMembershipIds = getRecipeMembershipInOwnCookbooks(selectedRecipeForView.id).map((id) =>
      String(id)
    );
    const targetMembershipIds = recipeCookbookSelectionIds.map((id) => String(id));

    const cookbookIdsToAdd = targetMembershipIds.filter((id) => !currentMembershipIds.includes(id));
    const cookbookIdsToRemove = currentMembershipIds.filter((id) => !targetMembershipIds.includes(id));

    setIsSavingRecipeCookbookSelection(true);
    setRecipeDetailFeedback('');

    if (cookbookIdsToAdd.length > 0) {
      const rowsToAdd = cookbookIdsToAdd.map((cookbookId) => ({
        cookbook_id: Number(cookbookId),
        recipe_id: selectedRecipeForView.id,
      }));

      const { error: addError } = await supabase
        .from('cookbook_recipes')
        .upsert(rowsToAdd, { onConflict: 'cookbook_id,recipe_id', ignoreDuplicates: true });

      if (addError) {
        setIsSavingRecipeCookbookSelection(false);
        setRecipeDetailFeedback('No se pudieron actualizar los recetarios de la receta.');
        return;
      }
    }

    if (cookbookIdsToRemove.length > 0) {
      const { error: removeError } = await supabase
        .from('cookbook_recipes')
        .delete()
        .eq('recipe_id', selectedRecipeForView.id)
        .in(
          'cookbook_id',
          cookbookIdsToRemove.map((id) => Number(id))
        );

      if (removeError) {
        setIsSavingRecipeCookbookSelection(false);
        setRecipeDetailFeedback('No se pudieron actualizar los recetarios de la receta.');
        return;
      }
    }

    const refreshedCookbooks = await loadCookbooks();
    const refreshedCookbook = Array.isArray(refreshedCookbooks)
      ? refreshedCookbooks.find(
          (cookbook) => String(cookbook.id) === String(selectedCookbookForView?.id)
        )
      : null;

    if (refreshedCookbook) {
      setSelectedCookbookForView(refreshedCookbook);
      setCookbookRenameInput(refreshedCookbook.name || '');
    }

    const refreshedRecipe = Array.isArray(refreshedCookbooks)
      ? findRecipeAcrossCookbooks(refreshedCookbooks, selectedRecipeForView.id)
      : null;
    if (refreshedRecipe) {
      setSelectedRecipeForView(refreshedRecipe);
      setRecipeDetailDraft(buildRecipeDetailDraft(refreshedRecipe));
    }

    setIsSavingRecipeCookbookSelection(false);
    setIsRecipeCookbookPickerOpen(false);
    setRecipeDetailFeedback('Recetarios actualizados correctamente.');
  };

  const handleOpenRecipeListPicker = () => {
    const cleanIngredients = (recipeDetailDraft.ingredients || [])
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (cleanIngredients.length === 0) {
      setRecipeDetailFeedback('Esta receta no tiene ingredientes para agregar a la lista.');
      return;
    }

    const ingredientRows = cleanIngredients.map((name, index) => ({
      key: `ingredient-${index}-${name}`,
      name,
    }));
    setRecipeListIngredients(ingredientRows);
    setSelectedRecipeListIngredientKeys(ingredientRows.map((item) => item.key));
    setIsRecipeListPickerOpen(true);
  };

  const toggleRecipeListIngredientSelection = (ingredientKey) => {
    setSelectedRecipeListIngredientKeys((prevKeys) =>
      prevKeys.includes(ingredientKey)
        ? prevKeys.filter((currentKey) => currentKey !== ingredientKey)
        : [...prevKeys, ingredientKey]
    );
  };

  const handleAddSelectedIngredientsToShoppingList = async () => {
    if (!supabase || !isSupabaseConfigured || !userId) {
      setRecipeDetailFeedback('Debes iniciar sesión y configurar Supabase para usar la lista.');
      return;
    }

    const ingredientsToAdd = recipeListIngredients
      .filter((ingredient) => selectedRecipeListIngredientKeys.includes(ingredient.key))
      .map((ingredient) => ingredient.name);

    if (ingredientsToAdd.length === 0) {
      setRecipeDetailFeedback('Selecciona al menos un ingrediente.');
      return;
    }

    const sourceRecipeName = selectedRecipeForView?.name || recipeDetailDraft.title || '';
    const rowsToInsert = ingredientsToAdd.map((name) => ({
      user_id: userId,
      name: encodeShoppingItemName(name, sourceRecipeName),
    }));

    setIsAddingRecipeIngredientsToList(true);
    const { error } = await supabase.from('shopping_items').insert(rowsToInsert);
    setIsAddingRecipeIngredientsToList(false);

    if (error) {
      setRecipeDetailFeedback('No se pudieron agregar los ingredientes a la lista.');
      return;
    }

    setIsRecipeListPickerOpen(false);
    setRecipeDetailFeedback('Ingredientes agregados a la lista de compras.');

    if (activeTab === 'lista') {
      loadShoppingItems();
    }
  };

  const handleSavePlanAssignment = async () => {
    if (!supabase || !isSupabaseConfigured || !userId) {
      setPlanAssignFeedback('Debes iniciar sesión y configurar Supabase para planificar.');
      return;
    }

    const selectedRecipeId =
      planAssignmentRecipe?.id ||
      (selectedPlanRecipeId ? Number(selectedPlanRecipeId) : null);

    if (!selectedRecipeId) {
      setPlanAssignFeedback('Selecciona una receta para planificar.');
      return;
    }

    const normalizedDate = planAssignDate.trim();
    const isDateFormatValid = /^\d{4}-\d{2}-\d{2}$/.test(normalizedDate);
    if (!isDateFormatValid || Number.isNaN(new Date(`${normalizedDate}T00:00:00`).getTime())) {
      setPlanAssignFeedback('Ingresa una fecha válida en formato AAAA-MM-DD.');
      return;
    }

    const selectedMealOption = planMealOptions.find((option) => option.key === planAssignMealType);
    if (!selectedMealOption) {
      setPlanAssignFeedback('Selecciona si es desayuno, snack, almuerzo o cena.');
      return;
    }

    setIsSavingPlanAssignment(true);
    setPlanAssignFeedback('');

    const { data: existingPlanRow, error: existingPlanError } = await supabase
      .from('meal_plans')
      .select('breakfast_recipe_id, snack_recipe_id, lunch_recipe_id, dinner_recipe_id')
      .eq('user_id', userId)
      .eq('plan_date', normalizedDate)
      .maybeSingle();

    if (existingPlanError) {
      setIsSavingPlanAssignment(false);
      setPlanAssignFeedback('No se pudo preparar la asignación del plan.');
      return;
    }

    const mergedPlanSlots = {
      breakfast_recipe_id: existingPlanRow?.breakfast_recipe_id || null,
      snack_recipe_id: existingPlanRow?.snack_recipe_id || null,
      lunch_recipe_id: existingPlanRow?.lunch_recipe_id || null,
      dinner_recipe_id: existingPlanRow?.dinner_recipe_id || null,
      [selectedMealOption.column]: selectedRecipeId,
    };

    const payload = {
      user_id: userId,
      plan_date: normalizedDate,
      ...mergedPlanSlots,
    };

    const { error } = await supabase
      .from('meal_plans')
      .upsert(payload, { onConflict: 'user_id,plan_date' });

    setIsSavingPlanAssignment(false);

    if (error) {
      setPlanAssignFeedback('No se pudo guardar en el plan.');
      return;
    }

    const selectedRecipeName =
      planAssignmentRecipe?.name ||
      planRecipeOptions.find((recipe) => String(recipe.id) === String(selectedRecipeId))?.name ||
      'Receta';

    const successMessage = `${selectedRecipeName} agregada a ${selectedMealOption.label.toLowerCase()} del ${normalizedDate}.`;
    await loadMealPlansForWeek();
    if (isManualRecipeModalOpen) {
      setManualRecipeFeedback(successMessage);
    } else if (selectedRecipeForView) {
      setRecipeDetailFeedback(successMessage);
    } else {
      setPlanFeedback(successMessage);
    }

    closePlanAssignModal();
  };

  const updateManualIngredient = (targetIndex, value) => {
    setManualIngredients((prevItems) =>
      prevItems.map((item, index) => (index === targetIndex ? value : item))
    );
  };

  const addManualIngredient = () => {
    setManualIngredients((prevItems) => [...prevItems, '']);
  };

  const removeManualIngredient = (targetIndex) => {
    setManualIngredients((prevItems) => {
      const nextItems = prevItems.filter((_, index) => index !== targetIndex);
      return nextItems.length > 0 ? nextItems : [''];
    });
  };

  const handleManualIngredientSubmit = (targetIndex) => {
    const isLastItem = targetIndex === manualIngredients.length - 1;
    const hasValue = (manualIngredients[targetIndex] || '').trim().length > 0;
    if (!isLastItem || !hasValue) {
      return;
    }

    setManualIngredients((prevItems) => [...prevItems, '']);
    setTimeout(() => {
      ingredientInputRefs.current[targetIndex + 1]?.focus();
    }, 0);
  };

  const updateManualStep = (targetIndex, value) => {
    setManualSteps((prevItems) =>
      prevItems.map((item, index) => (index === targetIndex ? value : item))
    );
  };

  const addManualStep = () => {
    setManualSteps((prevItems) => [...prevItems, '']);
  };

  const removeManualStep = (targetIndex) => {
    setManualSteps((prevItems) => {
      const nextItems = prevItems.filter((_, index) => index !== targetIndex);
      return nextItems.length > 0 ? nextItems : [''];
    });
  };

  const handleManualStepSubmit = (targetIndex) => {
    const isLastItem = targetIndex === manualSteps.length - 1;
    const hasValue = (manualSteps[targetIndex] || '').trim().length > 0;
    if (!isLastItem || !hasValue) {
      return;
    }

    setManualSteps((prevItems) => [...prevItems, '']);
    setTimeout(() => {
      stepInputRefs.current[targetIndex + 1]?.focus();
    }, 0);
  };

  const handleSaveManualRecipe = async () => {
    if (!supabase || !isSupabaseConfigured || !userId) {
      setManualRecipeFeedback('Debes iniciar sesión y configurar Supabase para guardar recetas.');
      return;
    }

    const name = manualRecipeTitle.trim();
    if (!name) {
      setManualRecipeFeedback('El título es obligatorio.');
      return;
    }

    const cleanIngredients = manualIngredients
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    const cleanSteps = manualSteps.map((item) => item.trim()).filter((item) => item.length > 0);

    setIsSavingManualRecipe(true);
    setManualRecipeFeedback('');

    const manualDescription = manualRecipeDescription.trim();
    const recipeDescription = composeRecipeDescription(manualDescription, cleanIngredients);
    const normalizedTargetCookbookIds = [...new Set(selectedCookbookIds.map((id) => Number(id)))].filter(
      (id) => Number.isFinite(id)
    );
    let savedRecipeId = manualRecipeEditingId;
    let saveMessage = 'Receta guardada correctamente.';

    if (isEditingRecipeInManualForm) {
      const { error: updateError } = await supabase
        .from('recipes')
        .update({
          name,
          description: recipeDescription || 'Receta editada manualmente.',
          main_photo_url: manualMainPhotoUrl || null,
          steps: cleanSteps,
          instructions: cleanSteps.join('\n'),
        })
        .eq('id', manualRecipeEditingId)
        .eq('owner_user_id', userId);

      if (updateError) {
        setIsSavingManualRecipe(false);
        setManualRecipeFeedback(updateError.message || 'No se pudo actualizar la receta.');
        return;
      }

      const currentMembershipIds = getRecipeMembershipInOwnCookbooks(manualRecipeEditingId).map((id) => Number(id));
      const cookbookIdsToAdd = normalizedTargetCookbookIds.filter((id) => !currentMembershipIds.includes(id));
      const cookbookIdsToRemove = currentMembershipIds.filter((id) => !normalizedTargetCookbookIds.includes(id));

      if (cookbookIdsToAdd.length > 0) {
        const rowsToAdd = cookbookIdsToAdd.map((cookbookId) => ({
          cookbook_id: cookbookId,
          recipe_id: manualRecipeEditingId,
        }));

        const { error: addError } = await supabase
          .from('cookbook_recipes')
          .upsert(rowsToAdd, { onConflict: 'cookbook_id,recipe_id', ignoreDuplicates: true });

        if (addError) {
          setIsSavingManualRecipe(false);
          setManualRecipeFeedback('La receta se actualizó, pero falló la actualización de recetarios.');
          return;
        }
      }

      if (cookbookIdsToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('cookbook_recipes')
          .delete()
          .eq('recipe_id', manualRecipeEditingId)
          .in('cookbook_id', cookbookIdsToRemove);

        if (removeError) {
          setIsSavingManualRecipe(false);
          setManualRecipeFeedback('La receta se actualizó, pero falló la actualización de recetarios.');
          return;
        }
      }

      saveMessage = 'Receta actualizada correctamente.';
    } else {
      const { data: insertedRecipe, error: insertError } = await supabase
        .from('recipes')
        .insert({
          owner_user_id: userId,
          name,
          description: recipeDescription || 'Receta creada manualmente.',
          main_photo_url: manualMainPhotoUrl || null,
          additional_photos: [],
          steps: cleanSteps,
          instructions: cleanSteps.join('\n'),
          is_public: false,
        })
        .select('id')
        .single();

      if (insertError) {
        setIsSavingManualRecipe(false);
        setManualRecipeFeedback(insertError.message || 'No se pudo guardar la receta.');
        return;
      }

      savedRecipeId = insertedRecipe?.id || null;
      if (savedRecipeId && normalizedTargetCookbookIds.length > 0) {
        const rowsToAdd = normalizedTargetCookbookIds.map((cookbookId) => ({
          cookbook_id: cookbookId,
          recipe_id: savedRecipeId,
        }));

        const { error: addError } = await supabase
          .from('cookbook_recipes')
          .upsert(rowsToAdd, { onConflict: 'cookbook_id,recipe_id', ignoreDuplicates: true });

        if (addError) {
          saveMessage = 'Receta guardada, pero no se pudo asociar a los recetarios seleccionados.';
        }
      }
    }

    const refreshedCookbooks = await loadCookbooks();
    if (Array.isArray(refreshedCookbooks)) {
      if (selectedCookbookForView?.id) {
        const refreshedCookbook = refreshedCookbooks.find(
          (cookbook) => String(cookbook.id) === String(selectedCookbookForView.id)
        );
        if (refreshedCookbook) {
          setSelectedCookbookForView(refreshedCookbook);
          setCookbookRenameInput(refreshedCookbook.name || '');
        } else {
          setSelectedCookbookForView(null);
          setSelectedRecipeForView(null);
          setRecipeDetailFeedback('');
        }
      }

      if (savedRecipeId) {
        const refreshedRecipe = findRecipeAcrossCookbooks(refreshedCookbooks, savedRecipeId);
        if (refreshedRecipe) {
          setSelectedRecipeForView(refreshedRecipe);
          setRecipeDetailDraft(buildRecipeDetailDraft(refreshedRecipe));
        }
      }
    }

    setIsSavingManualRecipe(false);
    if (isEditingRecipeInManualForm) {
      setRecipeDetailFeedback(saveMessage);
    }
    setManualRecipeFeedback(saveMessage);
    setTimeout(() => {
      closeManualRecipeForm();
    }, 700);
  };

  const openRecipeInManualEditForm = async (recipeId, importedRecipeFallback = null) => {
    if (!supabase || !isSupabaseConfigured || !userId || !recipeId) {
      return;
    }

    const { data: fetchedRecipe, error: recipeError } = await supabase
      .from('recipes')
      .select('id, owner_user_id, name, description, main_photo_url, steps, instructions')
      .eq('id', recipeId)
      .eq('owner_user_id', userId)
      .single();

    let recipeData = fetchedRecipe;
    if (!recipeData && importedRecipeFallback && String(importedRecipeFallback.id) === String(recipeId)) {
      recipeData = {
        id: importedRecipeFallback.id,
        owner_user_id: userId,
        name: importedRecipeFallback.name || '',
        description: importedRecipeFallback.description || '',
        main_photo_url: importedRecipeFallback.main_photo_url || '',
        steps: importedRecipeFallback.steps || [],
        instructions: importedRecipeFallback.instructions || '',
      };
    }

    if (recipeError && !recipeData) {
      setImportFeedback('Se importó, pero no se pudo abrir en modo edición.');
      return;
    }

    const { descriptionText, ingredients } = splitRecipeDescription(recipeData.description || '');
    const cleanSteps = normalizeRecipeSteps(recipeData.steps, recipeData.instructions);
    const refreshedCookbooks = await loadCookbooks();
    const sourceOwnCookbooks = Array.isArray(refreshedCookbooks)
      ? refreshedCookbooks.filter((cookbook) => cookbook.owner_user_id === userId)
      : ownCookbooks;

    const cookbookIds = sourceOwnCookbooks
      .filter((cookbook) =>
        (cookbook.recipes || []).some((recipe) => String(recipe.id) === String(recipeData.id))
      )
      .map((cookbook) => cookbook.id);

    setManualRecipeEditingId(recipeData.id);
    setManualRecipeTitle(recipeData.name || '');
    setManualMainPhotoUrl(recipeData.main_photo_url || '');
    setManualRecipeDescription(descriptionText);
    setManualIngredients(ingredients.length > 0 ? ingredients : ['']);
    setManualSteps(cleanSteps.length > 0 ? cleanSteps : ['']);
    setSelectedCookbookIds(cookbookIds);
    setManualRecipeFeedback('Receta importada. Ajusta lo necesario y guarda cambios.');
    setIsImportUrlModalOpen(false);
    setImportUrl('');
    setImportFeedback('');
    setIsManualRecipeModalOpen(true);
  };

  const handleImportRecipeFromUrl = async () => {
    if (!supabase || !isSupabaseConfigured || !userId) {
      setImportFeedback('Debes iniciar sesión y configurar Supabase para importar.');
      return;
    }

    const rawUrl = importUrl.trim();
    if (!rawUrl) {
      setImportFeedback('Ingresa una URL válida.');
      return;
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(rawUrl);
    } catch (_error) {
      setImportFeedback('La URL no es válida.');
      return;
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      setImportFeedback('Solo se permiten URLs http o https.');
      return;
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session?.access_token) {
      setImportFeedback('Tu sesión no es válida. Cierra sesión y vuelve a entrar.');
      return;
    }

    const accessToken = sessionData.session.access_token;

    setIsImportingRecipe(true);
    setImportFeedback('Importando receta...');

    let data;
    let error;
    try {
      const response = await supabase.functions.invoke('import-recipe-from-url', {
        body: {
          url: parsedUrl.toString(),
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      data = response.data;
      error = response.error;
    } catch (invokeError) {
      setIsImportingRecipe(false);
      setImportFeedback(invokeError instanceof Error ? invokeError.message : 'Error al invocar la función.');
      return;
    }

    setIsImportingRecipe(false);

    if (error) {
      let detailedMessage = error.message || 'No se pudo importar la receta.';
      const contextResponse = error.context;

      if (contextResponse) {
        const statusPrefix = contextResponse.status ? `(${contextResponse.status}) ` : '';

        try {
          const payload = await contextResponse.clone().json();
          const functionMessage =
            (typeof payload?.error === 'string' && payload.error) ||
            (typeof payload?.message === 'string' && payload.message) ||
            '';
          if (functionMessage) {
            detailedMessage = `${statusPrefix}${functionMessage}`;
          } else {
            detailedMessage = `${statusPrefix}${detailedMessage}`;
          }
        } catch (_jsonError) {
          try {
            const rawText = await contextResponse.clone().text();
            if (rawText) {
              detailedMessage = `${statusPrefix}${rawText}`;
            } else {
              detailedMessage = `${statusPrefix}${detailedMessage}`;
            }
          } catch (_textError) {
            detailedMessage = `${statusPrefix}${detailedMessage}`;
          }
        }
      }

      setImportFeedback(detailedMessage);
      return;
    }

    if (data?.error) {
      setImportFeedback(data.error);
      return;
    }

    const importedRecipeId = data?.recipe?.id;
    if (!importedRecipeId) {
      setImportFeedback('Receta importada, pero no se pudo abrir para editar.');
      return;
    }

    await openRecipeInManualEditForm(importedRecipeId, data?.recipe || null);
  };

  return (
    <View style={styles.screen}>
      <Animated.View
        style={{
          flex: 1,
          opacity: tabContentOpacity,
          transform: [{ translateY: tabContentTranslateY }],
        }}
      >
        <ScrollView contentContainerStyle={styles.contentArea}>
          {selectedRecipeForView ? (
            renderRecipeDetailView()
          ) : (
            <>
              {displayedTab === 'recetas' && renderRecetasView()}

              {displayedTab === 'lista' && renderListaView()}

              {displayedTab === 'plan' && renderPlanView()}

              {displayedTab === 'perfil' && (
                <View>
                  <Text style={styles.title}>Perfil</Text>
                  <Text style={styles.body}>
                    Aquí irá la configuración de cuenta, preferencias y datos personales.
                  </Text>
                  <View style={styles.profileCard}>
                    {userEmail ? <Text style={styles.sessionText}>Sesion activa: {userEmail}</Text> : null}
                    <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                      <Text style={styles.logoutText}>Cerrar sesion</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </Animated.View>

      <View style={styles.bottomBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon}
                size={20}
                color={isActive ? palette.accent : '#D9F4EE'}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {!selectedRecipeForView ? (
        <TouchableOpacity
          style={styles.fabButton}
          onPress={openCreateRecipeSheet}
          activeOpacity={0.9}
        >
          <Ionicons name="add" size={28} color={palette.card} />
        </TouchableOpacity>
      ) : null}

      <Modal
        visible={isCreateRecipeSheetOpen}
        animationType="none"
        transparent
        onRequestClose={closeCreateRecipeSheet}
      >
        <View style={styles.sheetOverlay}>
          <Animated.View style={[styles.sheetBackdrop, { opacity: sheetBackdropOpacity }]}>
            <Pressable style={styles.sheetBackdropPressable} onPress={closeCreateRecipeSheet} />
          </Animated.View>
          <Animated.View style={[styles.sheetContainer, { transform: [{ translateY: sheetTranslateY }] }]}>
            <Text style={styles.sheetTitle}>Agregar Receta</Text>

            <TouchableOpacity style={styles.sheetOption} onPress={handleOpenBrowserImport}>
              <View style={styles.sheetOptionContent}>
                <Ionicons name="globe-outline" size={20} color={palette.accent} />
                <Text style={styles.sheetOptionText}>Navegador</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetOption} onPress={closeCreateRecipeSheet}>
              <View style={styles.sheetOptionContent}>
                <Ionicons name="camera-outline" size={20} color={palette.accent} />
                <Text style={styles.sheetOptionText}>Camara</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetOption} onPress={closeCreateRecipeSheet}>
              <View style={styles.sheetOptionContent}>
                <Ionicons name="clipboard-outline" size={20} color={palette.accent} />
                <Text style={styles.sheetOptionText}>Pegar texto</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetOption} onPress={handleOpenManualRecipeForm}>
              <View style={styles.sheetOptionContent}>
                <Ionicons name="create-outline" size={20} color={palette.accent} />
                <Text style={styles.sheetOptionText}>Escribir desde cero</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      <Modal
        visible={isImportUrlModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsImportUrlModalOpen(false)}
      >
        <View style={styles.importOverlay}>
          <Pressable style={styles.importBackdrop} onPress={() => setIsImportUrlModalOpen(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.importPopupWrap}
          >
            <View style={styles.importPopup}>
              <Text style={styles.importTitle}>Importar desde URL</Text>
              <Text style={styles.importSubtitle}>
                Pega un enlace web o social (TikTok, Instagram, Pinterest). El sistema intentará extraer
                nombre, fotos, descripción, ingredientes, pasos e instrucciones.
              </Text>

              <TextInput
                style={styles.importInput}
                value={importUrl}
                onChangeText={setImportUrl}
                placeholder="https://..."
                placeholderTextColor={palette.mutedText}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                editable={!isImportingRecipe}
              />

              {importFeedback ? (
                <Text
                  style={[
                    styles.importFeedback,
                    importFeedback.includes('correctamente') && styles.importFeedbackSuccess,
                    importFeedback.toLowerCase().includes('importando') && styles.importFeedbackInfo,
                  ]}
                >
                  {importFeedback}
                </Text>
              ) : null}

              <View style={styles.importActions}>
                <TouchableOpacity
                  style={[styles.importButtonSecondary, isImportingRecipe && styles.buttonDisabled]}
                  onPress={() => setIsImportUrlModalOpen(false)}
                  disabled={isImportingRecipe}
                >
                  <Text style={styles.importButtonSecondaryText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.importButtonPrimary,
                    (isImportingRecipe || !importUrl.trim()) && styles.buttonDisabled,
                  ]}
                  onPress={handleImportRecipeFromUrl}
                  disabled={isImportingRecipe || !importUrl.trim()}
                >
                  <Text style={styles.importButtonPrimaryText}>
                    {isImportingRecipe ? 'Importando...' : 'Importar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={isManualRecipeModalOpen}
        animationType="slide"
        onRequestClose={closeManualRecipeForm}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.manualScreen}
        >
          <View style={styles.manualHero}>
            <View style={styles.manualHeroTop}>
              <TouchableOpacity
                style={styles.manualRoundIcon}
                onPress={closeManualRecipeForm}
              >
                <Ionicons name="chevron-back" size={22} color={palette.card} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.manualShareAction}>
                <Text style={styles.manualShareText}>Compartir</Text>
                <Ionicons name="share-outline" size={18} color={palette.card} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.manualHeroCenter} onPress={handlePickManualPhoto} activeOpacity={0.9}>
              {manualMainPhotoUrl ? (
                <Image source={{ uri: manualMainPhotoUrl }} style={styles.manualHeroPhoto} resizeMode="cover" />
              ) : (
                <View style={styles.manualHeroPhotoPlaceholder}>
                  <Ionicons name="add" size={48} color={palette.accent} />
                  <Text style={styles.manualHeroPhotoHint}>Agregar foto</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.manualTitleBar}>
            <TextInput
              style={styles.manualTitleInput}
              value={manualRecipeTitle}
              onChangeText={setManualRecipeTitle}
              placeholder="Título..."
              placeholderTextColor="#D6E2F2"
            />
          </View>

          <ScrollView style={styles.manualBody} contentContainerStyle={styles.manualBodyContent}>
            <View style={styles.manualQuickActionsRow}>
              <TouchableOpacity
                style={styles.manualQuickAction}
                onPress={handleOpenCookbookPicker}
              >
                <View style={styles.manualQuickActionIcon}>
                  <Ionicons name="book-outline" size={20} color={palette.accent} />
                </View>
                <Text style={styles.manualQuickActionText}>Recetarios</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.manualQuickAction}
                onPress={handleOpenPlanFromManualForm}
              >
                <View style={styles.manualQuickActionIcon}>
                  <Ionicons name="calendar-outline" size={20} color={palette.accent} />
                </View>
                <Text style={styles.manualQuickActionText}>Plan</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.manualQuickAction}
                onPress={() => handleManualQuickAccess('lista')}
              >
                <View style={styles.manualQuickActionIcon}>
                  <Ionicons name="checkbox-outline" size={20} color={palette.accent} />
                </View>
                <Text style={styles.manualQuickActionText}>Lista</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.manualQuickAction}
                onPress={() => setManualRecipeFeedback('Compartir estara disponible pronto.')}
              >
                <View style={styles.manualQuickActionIcon}>
                  <Ionicons name="share-social-outline" size={20} color={palette.accent} />
                </View>
                <Text style={styles.manualQuickActionText}>Compartir</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.manualDescriptionInput}
              value={manualRecipeDescription}
              onChangeText={setManualRecipeDescription}
              placeholder="Agrega una descripcion breve..."
              placeholderTextColor={palette.mutedText}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <Text style={styles.manualSectionTitle}>Ingredientes</Text>
            {manualIngredients.map((item, index) => (
              <View key={`ingredient-${index}`} style={styles.manualListRow}>
                <TouchableOpacity
                  style={styles.manualDeleteItemButton}
                  onPress={() => removeManualIngredient(index)}
                >
                  <Ionicons name="remove-circle-outline" size={18} color="#8B9AAA" />
                </TouchableOpacity>
                <TextInput
                  ref={(ref) => {
                    ingredientInputRefs.current[index] = ref;
                  }}
                  style={styles.manualListInput}
                  value={item}
                  onChangeText={(value) => updateManualIngredient(index, value)}
                  placeholder="Agregar ingrediente..."
                  placeholderTextColor={palette.mutedText}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => handleManualIngredientSubmit(index)}
                />
              </View>
            ))}
            <TouchableOpacity style={styles.manualAddMiniButton} onPress={addManualIngredient}>
              <Ionicons name="add" size={18} color={palette.card} />
            </TouchableOpacity>

            <Text style={[styles.manualSectionTitle, styles.manualSectionSpacing]}>Preparación</Text>
            {manualSteps.map((item, index) => (
              <View key={`step-${index}`} style={styles.manualListRow}>
                <TouchableOpacity
                  style={styles.manualDeleteItemButton}
                  onPress={() => removeManualStep(index)}
                >
                  <Ionicons name="remove-circle-outline" size={18} color="#8B9AAA" />
                </TouchableOpacity>
                <Text style={styles.manualStepNumber}>{index + 1}.</Text>
                <TextInput
                  ref={(ref) => {
                    stepInputRefs.current[index] = ref;
                  }}
                  style={styles.manualListInput}
                  value={item}
                  onChangeText={(value) => updateManualStep(index, value)}
                  placeholder="Agregar preparación..."
                  placeholderTextColor={palette.mutedText}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => handleManualStepSubmit(index)}
                />
              </View>
            ))}
            <TouchableOpacity style={styles.manualAddMiniButton} onPress={addManualStep}>
              <Ionicons name="add" size={18} color={palette.card} />
            </TouchableOpacity>

            {manualRecipeFeedback ? (
              <Text
                style={[
                  styles.manualFeedback,
                  manualRecipeFeedback.includes('correctamente') && styles.manualFeedbackSuccess,
                ]}
              >
                {manualRecipeFeedback}
              </Text>
            ) : null}

            <TouchableOpacity
              style={[styles.manualSaveButton, isSavingManualRecipe && styles.buttonDisabled]}
              onPress={handleSaveManualRecipe}
              disabled={isSavingManualRecipe}
            >
              <Text style={styles.manualSaveButtonText}>
                {isSavingManualRecipe
                  ? isEditingRecipeInManualForm
                    ? 'Guardando cambios...'
                    : 'Guardando...'
                  : isEditingRecipeInManualForm
                  ? 'Guardar cambios'
                  : 'Guardar receta'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={isRecipeCookbookPickerOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsRecipeCookbookPickerOpen(false)}
      >
        <View style={styles.cookbookPickerOverlay}>
          <Pressable
            style={styles.cookbookPickerBackdrop}
            onPress={() => setIsRecipeCookbookPickerOpen(false)}
          />
          <View style={styles.cookbookPickerPopup}>
            <Text style={styles.cookbookPickerTitle}>Recetarios de la receta</Text>
            <Text style={styles.cookbookPickerSubtitle}>
              Selecciona 0, 1 o varios recetarios para esta receta.
            </Text>

            {ownCookbooks.length === 0 ? (
              <Text style={styles.cookbookPickerEmptyText}>
                Aún no tienes recetarios disponibles.
              </Text>
            ) : (
              <ScrollView style={styles.cookbookPickerList}>
                {ownCookbooks.map((cookbook) => {
                  const isSelected = recipeCookbookSelectionIds.includes(cookbook.id);

                  return (
                    <TouchableOpacity
                      key={`recipe-cookbook-${cookbook.id}`}
                      style={[
                        styles.cookbookPickerItem,
                        isSelected && styles.cookbookPickerItemSelected,
                      ]}
                      onPress={() => toggleRecipeCookbookSelection(cookbook.id)}
                    >
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                        size={20}
                        color={isSelected ? palette.button : '#8B9AAA'}
                        style={styles.cookbookPickerItemIcon}
                      />
                      <View style={styles.cookbookPickerItemTextWrap}>
                        <Text style={styles.cookbookPickerItemTitle}>{cookbook.name}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.cookbookPickerActions}>
              <TouchableOpacity
                style={[styles.importButtonSecondary, isSavingRecipeCookbookSelection && styles.buttonDisabled]}
                onPress={() => setIsRecipeCookbookPickerOpen(false)}
                disabled={isSavingRecipeCookbookSelection}
              >
                <Text style={styles.importButtonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.importButtonPrimary, isSavingRecipeCookbookSelection && styles.buttonDisabled]}
                onPress={handleSaveRecipeCookbookSelection}
                disabled={isSavingRecipeCookbookSelection}
              >
                <Text style={styles.importButtonPrimaryText}>
                  {isSavingRecipeCookbookSelection ? 'Guardando...' : 'Guardar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isRecipeListPickerOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsRecipeListPickerOpen(false)}
      >
        <View style={styles.cookbookPickerOverlay}>
          <Pressable
            style={styles.cookbookPickerBackdrop}
            onPress={() => setIsRecipeListPickerOpen(false)}
          />
          <View style={styles.cookbookPickerPopup}>
            <Text style={styles.cookbookPickerTitle}>Agregar ingredientes a lista</Text>
            <Text style={styles.cookbookPickerSubtitle}>
              Selecciona los ingredientes que quieres pasar a tu lista de compras.
            </Text>

            <ScrollView style={styles.cookbookPickerList}>
              {recipeListIngredients.map((ingredient) => {
                const isSelected = selectedRecipeListIngredientKeys.includes(ingredient.key);

                return (
                  <TouchableOpacity
                    key={ingredient.key}
                    style={[
                      styles.cookbookPickerItem,
                      isSelected && styles.cookbookPickerItemSelected,
                    ]}
                    onPress={() => toggleRecipeListIngredientSelection(ingredient.key)}
                  >
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={isSelected ? palette.button : '#8B9AAA'}
                      style={styles.cookbookPickerItemIcon}
                    />
                    <View style={styles.cookbookPickerItemTextWrap}>
                      <Text style={styles.cookbookPickerItemTitle}>{ingredient.name}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.cookbookPickerActions}>
              <TouchableOpacity
                style={[styles.importButtonSecondary, isAddingRecipeIngredientsToList && styles.buttonDisabled]}
                onPress={() => setIsRecipeListPickerOpen(false)}
                disabled={isAddingRecipeIngredientsToList}
              >
                <Text style={styles.importButtonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.importButtonPrimary, isAddingRecipeIngredientsToList && styles.buttonDisabled]}
                onPress={handleAddSelectedIngredientsToShoppingList}
                disabled={isAddingRecipeIngredientsToList}
              >
                <Text style={styles.importButtonPrimaryText}>
                  {isAddingRecipeIngredientsToList ? 'Agregando...' : 'Agregar a lista'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isPlanAssignModalOpen}
        animationType="fade"
        transparent
        onRequestClose={closePlanAssignModal}
      >
        <View style={styles.cookbookPickerOverlay}>
          <Pressable style={styles.cookbookPickerBackdrop} onPress={closePlanAssignModal} />
          <View style={styles.cookbookPickerPopup}>
            <Text style={styles.cookbookPickerTitle}>Agregar al plan</Text>
            <Text style={styles.cookbookPickerSubtitle}>
              Selecciona fecha y tiempo de comida para esta receta.
            </Text>

            {planAssignmentRecipe?.name ? (
              <Text style={styles.planAssignRecipeName}>{planAssignmentRecipe.name}</Text>
            ) : isPlanRecipeOptionsLoading ? (
              <View style={styles.cookbookPickerLoadingWrap}>
                <ActivityIndicator size="small" color={palette.accent} />
              </View>
            ) : planRecipeOptions.length === 0 ? (
              <Text style={styles.cookbookPickerEmptyText}>
                No tienes recetas disponibles para planificar.
              </Text>
            ) : (
              <View style={styles.planRecipeOptionsWrap}>
                <Text style={styles.planRecipeOptionsLabel}>Receta</Text>
                <ScrollView style={styles.planRecipeOptionsList}>
                  {planRecipeOptions.map((recipe) => {
                    const isSelected = String(recipe.id) === String(selectedPlanRecipeId);

                    return (
                      <TouchableOpacity
                        key={`plan-recipe-option-${recipe.id}`}
                        style={[
                          styles.cookbookPickerItem,
                          isSelected && styles.cookbookPickerItemSelected,
                        ]}
                        onPress={() => setSelectedPlanRecipeId(String(recipe.id))}
                      >
                        <Ionicons
                          name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                          size={20}
                          color={isSelected ? palette.button : '#8B9AAA'}
                          style={styles.cookbookPickerItemIcon}
                        />
                        <View style={styles.cookbookPickerItemTextWrap}>
                          <Text style={styles.cookbookPickerItemTitle}>{recipe.name}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <TextInput
              style={styles.importInput}
              value={planAssignDate}
              onChangeText={setPlanAssignDate}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={palette.mutedText}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSavingPlanAssignment}
            />

            <View style={styles.planAssignMealRow}>
              {planMealOptions.map((option) => {
                const isSelected = planAssignMealType === option.key;
                return (
                  <TouchableOpacity
                    key={`meal-option-${option.key}`}
                    style={[
                      styles.planAssignMealButton,
                      isSelected && styles.planAssignMealButtonSelected,
                      isSavingPlanAssignment && styles.buttonDisabled,
                    ]}
                    onPress={() => setPlanAssignMealType(option.key)}
                    disabled={isSavingPlanAssignment}
                  >
                    <Text
                      style={[
                        styles.planAssignMealButtonText,
                        isSelected && styles.planAssignMealButtonTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {planAssignFeedback ? <Text style={styles.feedback}>{planAssignFeedback}</Text> : null}

            <View style={styles.cookbookPickerActions}>
              <TouchableOpacity
                style={[styles.importButtonSecondary, isSavingPlanAssignment && styles.buttonDisabled]}
                onPress={closePlanAssignModal}
                disabled={isSavingPlanAssignment}
              >
                <Text style={styles.importButtonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.importButtonPrimary, isSavingPlanAssignment && styles.buttonDisabled]}
                onPress={handleSavePlanAssignment}
                disabled={isSavingPlanAssignment}
              >
                <Text style={styles.importButtonPrimaryText}>
                  {isSavingPlanAssignment ? 'Guardando...' : 'Guardar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isMoveRecipesPickerOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsMoveRecipesPickerOpen(false)}
      >
        <View style={styles.cookbookPickerOverlay}>
          <Pressable
            style={styles.cookbookPickerBackdrop}
            onPress={() => setIsMoveRecipesPickerOpen(false)}
          />
          <View style={styles.cookbookPickerPopup}>
            <Text style={styles.cookbookPickerTitle}>Mover recetas</Text>
            <Text style={styles.cookbookPickerSubtitle}>
              Selecciona el recetario destino para las recetas elegidas.
            </Text>

            {moveTargetCookbooks.length === 0 ? (
              <Text style={styles.cookbookPickerEmptyText}>
                No hay recetarios disponibles para mover.
              </Text>
            ) : (
              <ScrollView style={styles.cookbookPickerList}>
                {moveTargetCookbooks.map((cookbook) => (
                  <TouchableOpacity
                    key={`move-target-${cookbook.id}`}
                    style={styles.cookbookPickerItem}
                    onPress={() => {
                      setIsMoveRecipesPickerOpen(false);
                      handleMoveSelectedRecipesToCookbook(cookbook.id);
                    }}
                    disabled={isMutatingCookbookView}
                  >
                    <Ionicons
                      name="arrow-forward-circle-outline"
                      size={20}
                      color={palette.button}
                      style={styles.cookbookPickerItemIcon}
                    />
                    <View style={styles.cookbookPickerItemTextWrap}>
                      <Text style={styles.cookbookPickerItemTitle}>{cookbook.name}</Text>
                      <Text style={styles.cookbookPickerItemMeta}>
                        {cookbook.recipeCount || 0}{' '}
                        {(cookbook.recipeCount || 0) === 1 ? 'receta' : 'recetas'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.cookbookPickerActions}>
              <TouchableOpacity
                style={styles.importButtonSecondary}
                onPress={() => setIsMoveRecipesPickerOpen(false)}
              >
                <Text style={styles.importButtonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isCookbookPickerOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsCookbookPickerOpen(false)}
      >
        <View style={styles.cookbookPickerOverlay}>
          <Pressable
            style={styles.cookbookPickerBackdrop}
            onPress={() => setIsCookbookPickerOpen(false)}
          />
          <View style={styles.cookbookPickerPopup}>
            <Text style={styles.cookbookPickerTitle}>Seleccionar recetarios</Text>
            <Text style={styles.cookbookPickerSubtitle}>
              Elige en cuáles recetarios guardar esta receta.
            </Text>

            {isCookbooksLoading ? (
              <View style={styles.cookbookPickerLoadingWrap}>
                <ActivityIndicator size="small" color={palette.accent} />
              </View>
            ) : ownCookbooks.length === 0 ? (
              <Text style={styles.cookbookPickerEmptyText}>
                Aún no tienes recetarios propios para seleccionar.
              </Text>
            ) : (
              <ScrollView style={styles.cookbookPickerList}>
                {ownCookbooks.map((cookbook) => {
                  const isSelected = selectedCookbookIds.includes(cookbook.id);

                  return (
                    <TouchableOpacity
                      key={`picker-${cookbook.id}`}
                      style={[
                        styles.cookbookPickerItem,
                        isSelected && styles.cookbookPickerItemSelected,
                      ]}
                      onPress={() => toggleCookbookSelection(cookbook.id)}
                    >
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                        size={20}
                        color={isSelected ? palette.button : '#8B9AAA'}
                        style={styles.cookbookPickerItemIcon}
                      />
                      <View style={styles.cookbookPickerItemTextWrap}>
                        <Text style={styles.cookbookPickerItemTitle}>{cookbook.name}</Text>
                        <Text style={styles.cookbookPickerItemMeta}>
                          {cookbook.recipeCount || 0}{' '}
                          {(cookbook.recipeCount || 0) === 1 ? 'receta' : 'recetas'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.cookbookPickerActions}>
              <TouchableOpacity
                style={styles.importButtonSecondary}
                onPress={() => setIsCookbookPickerOpen(false)}
              >
                <Text style={styles.importButtonSecondaryText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  contentArea: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: {
    color: palette.accent,
    fontFamily: fonts.bold,
    fontSize: 30,
    marginBottom: spacing.md,
  },
  body: {
    color: palette.text,
    fontFamily: fonts.regular,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  placeholderCard: {
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCE6EC',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  placeholderTitle: {
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 17,
    marginBottom: spacing.sm,
  },
  placeholderBody: {
    color: palette.mutedText,
    fontFamily: fonts.regular,
  },
  warningCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  warningText: {
    color: '#B45309',
    fontFamily: fonts.regular,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#C6D4E8',
    borderRadius: 12,
    backgroundColor: '#FAFCFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    color: palette.accent,
  },
  addButton: {
    backgroundColor: palette.button,
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  secondaryAction: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.accent,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: palette.card,
  },
  secondaryActionText: {
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  feedback: {
    color: '#B42318',
    fontFamily: fonts.medium,
    marginBottom: spacing.sm,
  },
  loadingWrap: {
    paddingVertical: spacing.lg,
  },
  listCard: {
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCE6EC',
    padding: spacing.md,
  },
  emptyText: {
    color: palette.mutedText,
    fontFamily: fonts.regular,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
  },
  listItemContent: {
    flex: 1,
    paddingRight: 8,
  },
  itemText: {
    flex: 1,
    color: palette.accent,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  itemSourceText: {
    marginTop: 1,
    color: '#7A8A99',
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
  },
  itemTextCompleted: {
    color: palette.mutedText,
    textDecorationLine: 'line-through',
  },
  itemSourceTextCompleted: {
    color: '#98A2B3',
  },
  cookbooksList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cookbookCard: {
    backgroundColor: 'transparent',
    width: '48%',
    marginBottom: spacing.md,
  },
  cookbookPreview: {
    flexDirection: 'row',
    height: 120,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  previewLeft: {
    flex: 2,
    marginRight: 3,
  },
  previewRight: {
    flex: 1,
  },
  previewRightTop: {
    flex: 1,
    marginBottom: 3,
  },
  previewRightBottom: {
    flex: 1,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    flex: 1,
    backgroundColor: '#DAD2C4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cookbookTitle: {
    color: palette.accent,
    fontFamily: fonts.semiBold,
    fontSize: 18,
    lineHeight: 22,
    marginBottom: 1,
  },
  cookbookCount: {
    color: palette.mutedText,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 18,
  },
  planWeekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  planWeekArrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7892C2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planWeekRangeText: {
    color: '#6C8CC6',
    fontFamily: fonts.semiBold,
    fontSize: 18,
  },
  planFeedback: {
    color: '#5B6F82',
    fontFamily: fonts.regular,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  planDaysList: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  planDayBlock: {
    marginBottom: spacing.sm,
  },
  planDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  planDayTitle: {
    color: palette.accent,
    fontFamily: fonts.semiBold,
    fontSize: 17,
  },
  planDayAddButton: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: '#7892C2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planMealPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  planMealSlotWrap: {
    width: '24%',
    aspectRatio: 1,
  },
  planMealSlot: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D6DFE8',
    backgroundColor: '#EEF3F8',
  },
  planMealSlotImage: {
    width: '100%',
    height: '100%',
  },
  planMealSlotPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  planMealSlotLabel: {
    marginTop: 3,
    color: '#7A8A99',
    fontFamily: fonts.medium,
    fontSize: 10,
    textAlign: 'center',
  },
  planMealRemoveButton: {
    position: 'absolute',
    top: -7,
    right: -7,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#7B8FBC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.background,
  },
  planDayEmptyPill: {
    minHeight: 44,
    borderRadius: 22,
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: '#F7EEDC',
  },
  planDayEmptyText: {
    color: '#A7AEA8',
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  profileCard: {
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCE6EC',
    padding: spacing.md,
  },
  sessionText: {
    color: palette.mutedText,
    fontFamily: fonts.regular,
    marginBottom: spacing.md,
  },
  logoutButton: {
    backgroundColor: palette.button,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: palette.card,
    fontFamily: fonts.medium,
    fontWeight: '600',
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: palette.accent,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  fabButton: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 88,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: palette.button,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: palette.background,
    zIndex: 10,
    elevation: 4,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  sheetBackdropPressable: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: palette.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sheetTitle: {
    color: palette.accent,
    fontFamily: fonts.bold,
    fontSize: 24,
    marginBottom: spacing.md,
  },
  sheetOption: {
    borderWidth: 1,
    borderColor: '#DCE6EC',
    borderRadius: 12,
    backgroundColor: '#FAFCFF',
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: spacing.sm,
  },
  sheetOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetOptionText: {
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 16,
    marginLeft: 10,
  },
  importOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  importBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  importPopupWrap: {
    width: '100%',
  },
  importPopup: {
    backgroundColor: palette.card,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#DCE6EC',
  },
  importTitle: {
    color: palette.accent,
    fontFamily: fonts.semiBold,
    fontSize: 20,
    marginBottom: spacing.sm,
  },
  importSubtitle: {
    color: palette.text,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  importInput: {
    borderWidth: 1,
    borderColor: '#C6D4E8',
    borderRadius: 12,
    backgroundColor: '#FAFCFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    color: palette.accent,
    marginBottom: spacing.sm,
  },
  importFeedback: {
    color: '#B42318',
    fontFamily: fonts.medium,
    marginBottom: spacing.sm,
  },
  importFeedbackSuccess: {
    color: '#166534',
  },
  importFeedbackInfo: {
    color: '#1D4ED8',
  },
  importActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  importButtonSecondary: {
    minWidth: 112,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.accent,
    backgroundColor: palette.card,
    alignItems: 'center',
  },
  importButtonSecondaryText: {
    color: palette.accent,
    fontFamily: fonts.medium,
  },
  importButtonPrimary: {
    minWidth: 112,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: palette.button,
    alignItems: 'center',
  },
  importButtonPrimaryText: {
    color: palette.card,
    fontFamily: fonts.medium,
  },
  cookbookBackAction: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  cookbookBackActionText: {
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 14,
    marginLeft: 2,
  },
  recipeDetailTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  recipeDetailEditButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#C6D4E8',
    backgroundColor: '#FAFCFF',
  },
  recipeDetailEditButtonText: {
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  recipeDetailHero: {
    height: 260,
    backgroundColor: '#8FA4C6',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  recipeDetailHeroTouchable: {
    flex: 1,
  },
  recipeDetailHeroImage: {
    width: '100%',
    height: '100%',
  },
  recipeDetailHeroPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeDetailHeroHint: {
    marginTop: spacing.sm,
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  recipeDetailTitleBar: {
    backgroundColor: '#7892C2',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  recipeDetailTitleInput: {
    color: palette.card,
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 28,
  },
  recipeDetailTitleText: {
    color: palette.card,
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 28,
  },
  recipeDetailBody: {
    marginBottom: spacing.md,
  },
  recipeDetailDescriptionWrap: {
    borderWidth: 1,
    borderColor: '#DCE6EC',
    borderRadius: 12,
    backgroundColor: '#FAFCFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: spacing.lg,
  },
  recipeDetailDescription: {
    color: palette.accent,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  recipeDetailBullet: {
    width: 18,
    color: palette.accent,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  recipeDetailReadText: {
    flex: 1,
    color: palette.accent,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  cookbookRenameRow: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cookbookOrganizeWrap: {
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  cookbookOrganizeButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: palette.accent,
    borderRadius: 999,
    backgroundColor: palette.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cookbookOrganizeButtonText: {
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  cookbookRenameInput: {
    borderWidth: 1,
    borderColor: '#C6D4E8',
    borderRadius: 10,
    backgroundColor: '#FAFCFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    color: palette.accent,
  },
  cookbookRenameActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cookbookToolsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cookbookToolButton: {
    width: '22%',
    alignItems: 'center',
  },
  cookbookToolIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#DCE6EC',
    backgroundColor: '#FAFCFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cookbookToolLabel: {
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 11,
    textAlign: 'center',
  },
  cookbookSelectionPanelCompact: {
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#DCE6EC',
    borderRadius: 12,
    backgroundColor: '#FAFCFF',
    padding: spacing.sm,
  },
  cookbookSelectionText: {
    color: palette.mutedText,
    fontFamily: fonts.medium,
    fontSize: 13,
    marginBottom: 6,
  },
  cookbookSelectionCompactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cookbookCompactCancelButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.card,
  },
  cookbookRecipesScreenList: {
    marginTop: 4,
  },
  cookbookRecipeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE6EC',
    borderRadius: 12,
    backgroundColor: '#FAFCFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: spacing.sm,
  },
  cookbookRecipeItemSelected: {
    borderColor: palette.button,
    backgroundColor: '#EDF5FF',
  },
  cookbookRecipeThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 10,
  },
  cookbookRecipeName: {
    flex: 1,
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  cookbookRecipeSelectIcon: {
    marginRight: 10,
  },
  cookbookPickerOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  cookbookPickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  cookbookPickerPopup: {
    backgroundColor: palette.card,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#DCE6EC',
    maxHeight: '75%',
  },
  cookbookPickerTitle: {
    color: palette.accent,
    fontFamily: fonts.semiBold,
    fontSize: 20,
    marginBottom: 4,
  },
  cookbookPickerSubtitle: {
    color: palette.text,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  cookbookPickerLoadingWrap: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  cookbookPickerEmptyText: {
    color: palette.mutedText,
    fontFamily: fonts.regular,
    marginBottom: spacing.md,
  },
  cookbookPickerList: {
    marginBottom: spacing.md,
  },
  cookbookPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE6EC',
    borderRadius: 12,
    backgroundColor: '#FAFCFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: spacing.sm,
  },
  cookbookPickerItemSelected: {
    borderColor: palette.button,
    backgroundColor: '#EDF5FF',
  },
  cookbookPickerItemIcon: {
    marginRight: 10,
  },
  cookbookPickerItemTextWrap: {
    flex: 1,
  },
  cookbookPickerItemTitle: {
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  cookbookPickerItemMeta: {
    color: palette.mutedText,
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  cookbookPickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  planAssignRecipeName: {
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  planRecipeOptionsWrap: {
    marginBottom: spacing.sm,
  },
  planRecipeOptionsLabel: {
    color: palette.mutedText,
    fontFamily: fonts.medium,
    fontSize: 12,
    marginBottom: 6,
  },
  planRecipeOptionsList: {
    maxHeight: 180,
    marginBottom: spacing.sm,
  },
  planAssignMealRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  planAssignMealButton: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#C6D4E8',
    borderRadius: 10,
    backgroundColor: '#FAFCFF',
    paddingVertical: 10,
    alignItems: 'center',
  },
  planAssignMealButtonSelected: {
    borderColor: palette.button,
    backgroundColor: '#EDF5FF',
  },
  planAssignMealButtonText: {
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  planAssignMealButtonTextSelected: {
    color: palette.button,
  },
  manualScreen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  manualHero: {
    height: 320,
    backgroundColor: '#8FA4C6',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  manualHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  manualRoundIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7892C2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualShareAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  manualShareText: {
    color: palette.card,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  manualHeroCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  manualHeroPhoto: {
    width: '100%',
    height: '100%',
  },
  manualHeroPhotoPlaceholder: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualHeroPhotoHint: {
    marginTop: spacing.sm,
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  manualTitleBar: {
    backgroundColor: '#7892C2',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  manualTitleInput: {
    flex: 1,
    color: palette.card,
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 30,
  },
  manualBody: {
    flex: 1,
    backgroundColor: palette.background,
  },
  manualBodyContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  manualQuickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  manualQuickAction: {
    width: '23%',
    alignItems: 'center',
  },
  manualQuickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E3E7E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  manualQuickActionText: {
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 12,
    textAlign: 'center',
  },
  manualDescriptionInput: {
    borderWidth: 1,
    borderColor: '#C6D4E8',
    borderRadius: 12,
    backgroundColor: '#FAFCFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 78,
    color: palette.accent,
    fontFamily: fonts.regular,
    fontSize: 15,
    marginBottom: spacing.lg,
  },
  manualSectionTitle: {
    color: palette.accent,
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  manualSectionSpacing: {
    marginTop: spacing.lg,
  },
  manualListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  manualDeleteItemButton: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  manualStepNumber: {
    width: 18,
    color: palette.accent,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  manualListInput: {
    flex: 1,
    color: palette.accent,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 4,
  },
  manualAddMiniButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#7892C2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    marginTop: 2,
  },
  manualFeedback: {
    color: '#B42318',
    fontFamily: fonts.medium,
    fontSize: 13,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  manualFeedbackSuccess: {
    color: '#166534',
  },
  manualSaveButton: {
    marginTop: spacing.sm,
    backgroundColor: palette.button,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  manualSaveButtonText: {
    color: palette.card,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: palette.background,
  },
  tabLabel: {
    color: '#D9F4EE',
    fontSize: 12,
    marginTop: 4,
    fontFamily: fonts.medium,
  },
  tabLabelActive: {
    color: palette.accent,
    fontFamily: fonts.medium,
  },
});
