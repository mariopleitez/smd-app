import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ExpoClipboard from 'expo-clipboard';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { fonts, palette, spacing } from '../theme';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import RecetasTabScreen from './main-tabs/RecetasTabScreen';
import ListaTabScreen from './main-tabs/ListaTabScreen';
import PlanTabScreen from './main-tabs/PlanTabScreen';
import PerfilTabScreen from './main-tabs/PerfilTabScreen';

export default function PrincipalScreen({ onLogout, userEmail, userId, userName, userAvatar }) {
  const tabs = useMemo(
    () => [
      { key: 'recetas', label: 'Recetas', icon: 'restaurant-outline' },
      { key: 'plan', label: 'Plan', icon: 'calendar-outline' },
      { key: 'lista', label: 'Lista', icon: 'basket-outline' },
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
  const [cookbookSearchQuery, setCookbookSearchQuery] = useState('');
  const [isCookbooksLoading, setIsCookbooksLoading] = useState(false);
  const [isMutatingCookbooks, setIsMutatingCookbooks] = useState(false);
  const [cookbookFeedback, setCookbookFeedback] = useState('');
  const [isCreateCookbookSheetOpen, setIsCreateCookbookSheetOpen] = useState(false);
  const [newCookbookName, setNewCookbookName] = useState('');
  const [isCreateRecipeSheetOpen, setIsCreateRecipeSheetOpen] = useState(false);
  const [isCameraImportPickerOpen, setIsCameraImportPickerOpen] = useState(false);
  const [isImportUrlModalOpen, setIsImportUrlModalOpen] = useState(false);
  const [isPasteTextModalOpen, setIsPasteTextModalOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [pasteRecipeText, setPasteRecipeText] = useState('');
  const [isImportingRecipe, setIsImportingRecipe] = useState(false);
  const [imageImportProgressText, setImageImportProgressText] = useState('');
  const [importFeedback, setImportFeedback] = useState('');
  const [pasteRecipeFeedback, setPasteRecipeFeedback] = useState('');
  const [isManualRecipeModalOpen, setIsManualRecipeModalOpen] = useState(false);
  const [manualRecipeTitle, setManualRecipeTitle] = useState('');
  const [manualMainPhotoUrl, setManualMainPhotoUrl] = useState('');
  const [manualRecipeDescription, setManualRecipeDescription] = useState('');
  const [manualIngredients, setManualIngredients] = useState(['']);
  const [manualSteps, setManualSteps] = useState(['']);
  const [manualIsPublic, setManualIsPublic] = useState(false);
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
  const [isDeletingRecipe, setIsDeletingRecipe] = useState(false);
  const [isRecipeStepReorderMode, setIsRecipeStepReorderMode] = useState(false);
  const [draggingRecipeStepIndex, setDraggingRecipeStepIndex] = useState(null);
  const [isRecipeMoreDropdownOpen, setIsRecipeMoreDropdownOpen] = useState(false);
  const [isRecipeMoreMenuOpen, setIsRecipeMoreMenuOpen] = useState(false);
  const [isRecipeDeleteConfirmOpen, setIsRecipeDeleteConfirmOpen] = useState(false);
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
  const [planAssignDateMode, setPlanAssignDateMode] = useState('tomorrow');
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
  const [planRecipeSearchQuery, setPlanRecipeSearchQuery] = useState('');
  const [isPlanRecipeOptionsLoading, setIsPlanRecipeOptionsLoading] = useState(false);
  const [recipeDetailDraft, setRecipeDetailDraft] = useState({
    title: '',
    description: '',
    ingredients: [''],
    steps: [''],
    stepPhotos: [''],
    mainPhotoUrl: '',
    isPublic: false,
  });
  const [selectedCookbookRecipeIds, setSelectedCookbookRecipeIds] = useState([]);
  const [cookbookRecipeAction, setCookbookRecipeAction] = useState(null);
  const [cookbookViewFeedback, setCookbookViewFeedback] = useState('');
  const [isMutatingCookbookView, setIsMutatingCookbookView] = useState(false);
  const [isRenamingCookbook, setIsRenamingCookbook] = useState(false);
  const [cookbookRenameInput, setCookbookRenameInput] = useState('');
  const [isCookbookToolsOpen, setIsCookbookToolsOpen] = useState(false);
  const [isMoveRecipesPickerOpen, setIsMoveRecipesPickerOpen] = useState(false);
  const [recipeSearchScope, setRecipeSearchScope] = useState('mine');
  const [isRecipeSearchScopeMenuOpen, setIsRecipeSearchScopeMenuOpen] = useState(false);
  const [recipeSearchResults, setRecipeSearchResults] = useState([]);
  const [isSearchingRecipes, setIsSearchingRecipes] = useState(false);
  const [recipeSearchFeedback, setRecipeSearchFeedback] = useState('');
  const [recipeCookedById, setRecipeCookedById] = useState({});
  const [recipeRatingById, setRecipeRatingById] = useState({});
  const [recipeNoteById, setRecipeNoteById] = useState({});
  const ingredientInputRefs = useRef([]);
  const stepInputRefs = useRef([]);
  const stepDragStateRef = useRef({ currentIndex: -1, lastSwapTs: 0 });
  const tabContentOpacity = useRef(new Animated.Value(1)).current;
  const tabContentTranslateY = useRef(new Animated.Value(0)).current;
  const sheetBackdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(320)).current;
  const COOKBOOKS_CACHE_TTL_MS = 5 * 60 * 1000;
  const lastCookbooksLoadAtRef = useRef(0);
  const lastCookbooksUserRef = useRef('');
  const cookbooksRef = useRef([]);
  const recipeDetailsCacheRef = useRef({});
  const recipeDetailRequestIdRef = useRef(0);
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

  useEffect(() => {
    cookbooksRef.current = cookbooks;
  }, [cookbooks]);

  const loadCookbooks = useCallback(async ({ force = false } = {}) => {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    const currentUserKey = `user:${userId || 'anon'}`;
    const storageKey = `smd:cookbooks:${userId || 'anon'}`;
    if (lastCookbooksUserRef.current !== currentUserKey) {
      lastCookbooksUserRef.current = currentUserKey;
      lastCookbooksLoadAtRef.current = 0;
      recipeDetailsCacheRef.current = {};
      setCookbooks([]);
    }

    const now = Date.now();
    const cachedCookbooksInMemory = cookbooksRef.current;
    if (!force && lastCookbooksLoadAtRef.current && now - lastCookbooksLoadAtRef.current < COOKBOOKS_CACHE_TTL_MS) {
      return cachedCookbooksInMemory;
    }

    if (!force && userId) {
      try {
        const cachedRaw = await AsyncStorage.getItem(storageKey);
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          if (
            parsed &&
            Array.isArray(parsed.cookbooks) &&
            Number.isFinite(parsed.timestamp) &&
            parsed.cookbooks.length > 0
          ) {
            setCookbooks(parsed.cookbooks);
            lastCookbooksLoadAtRef.current = parsed.timestamp;

            if (now - parsed.timestamp < COOKBOOKS_CACHE_TTL_MS) {
              return parsed.cookbooks;
            }
          }
        }
      } catch (_cacheReadError) {
        // Si no se puede leer caché local, se continúa con la carga remota.
      }
    }

    setIsCookbooksLoading(!force && cachedCookbooksInMemory.length > 0 ? false : true);
    setCookbookFeedback('');

    let cookbooksRequest = supabase
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
            is_public
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (userId) {
      cookbooksRequest = cookbooksRequest.eq('owner_user_id', userId);
    }

    const userRecipesRequest = userId
      ? supabase
          .from('recipes')
          .select('id, owner_user_id, name, description, main_photo_url, is_public, created_at')
          .eq('owner_user_id', userId)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null });

    const [cookbooksResponse, userRecipesResponse] = await Promise.all([
      cookbooksRequest,
      userRecipesRequest,
    ]);
    const { data, error } = cookbooksResponse;
    const { data: userRecipes, error: userRecipesError } = userRecipesResponse;

    if (error) {
      setIsCookbooksLoading(false);
      setCookbookFeedback('No fue posible cargar los recetarios.');
      return null;
    }

    const buildPreviewRecipes = (recipes = []) => {
      const recipesWithPhoto = recipes.filter((recipe) =>
        Boolean(String(recipe?.main_photo_url || '').trim())
      );
      const recipesWithoutPhoto = recipes.filter(
        (recipe) => !Boolean(String(recipe?.main_photo_url || '').trim())
      );

      return [...recipesWithPhoto, ...recipesWithoutPhoto].slice(0, 3);
    };

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
        previewRecipes: buildPreviewRecipes(recipes),
      };
    });

    if (!userId) {
      setCookbooks(normalizedCookbooks);
      setIsCookbooksLoading(false);
      lastCookbooksLoadAtRef.current = Date.now();
      return normalizedCookbooks;
    }

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
              previewRecipes: buildPreviewRecipes(recipesWithoutCookbook),
            },
            ]
        : normalizedCookbooks;

    setCookbooks(listWithUnassigned);
    setIsCookbooksLoading(false);
    lastCookbooksLoadAtRef.current = Date.now();
    try {
      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify({
          timestamp: Date.now(),
          cookbooks: listWithUnassigned,
        })
      );
    } catch (_cacheWriteError) {
      // Si la caché local no está disponible, no bloqueamos el flujo.
    }
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
  const profileDisplayName = useMemo(() => {
    const explicitName = String(userName || '').trim();
    if (explicitName) {
      return explicitName;
    }

    const emailValue = String(userEmail || '').trim();
    if (emailValue.includes('@')) {
      return emailValue.split('@')[0];
    }

    return '';
  }, [userEmail, userName]);

  const isAuthorRecipe = useCallback(() => false, []);

  const getRecipeOwnerLabel = useCallback(
    (recipe) => {
      const fallbackPublicOwnerName =
        String(process.env.EXPO_PUBLIC_PUBLIC_OWNER_DISPLAY_NAME || 'Usuario').trim() ||
        'Usuario';

      if (!recipe) {
        return fallbackPublicOwnerName;
      }

      const ownerName = String(
        recipe.owner_name || recipe.owner_full_name || recipe.owner_username || ''
      ).trim();
      if (ownerName) {
        return ownerName;
      }

      const ownerId = String(recipe.owner_user_id || '');
      if (!ownerId) {
        return fallbackPublicOwnerName;
      }

      if (String(userId || '') === ownerId) {
        return 'Tú';
      }

      if (isAuthorRecipe(recipe)) {
        return String(process.env.EXPO_PUBLIC_AUTHOR_DISPLAY_NAME || 'Mario Chef').trim();
      }

      return fallbackPublicOwnerName;
    },
    [isAuthorRecipe, userId]
  );

  useEffect(() => {
    const query = cookbookSearchQuery.trim();
    if (activeTab !== 'recetas' || selectedCookbookForView) {
      return;
    }

    if (!query) {
      setRecipeSearchResults([]);
      setRecipeSearchFeedback('');
      setIsSearchingRecipes(false);
      return;
    }

    if (!isSupabaseConfigured || !supabase || !userId) {
      setRecipeSearchResults([]);
      setRecipeSearchFeedback('Debes iniciar sesión para buscar recetas.');
      setIsSearchingRecipes(false);
      return;
    }

    let isCancelled = false;
    const timer = setTimeout(async () => {
      setIsSearchingRecipes(true);
      setRecipeSearchFeedback('');

      let request = supabase
        .from('recipes')
        .select('id, owner_user_id, name, description, main_photo_url, is_public, created_at')
        .ilike('name', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(80);

      if (recipeSearchScope === 'mine') {
        request = request.eq('owner_user_id', userId);
      } else if (recipeSearchScope === 'savemydish') {
        request = request.eq('is_public', true);
      }

      const { data, error } = await request;
      if (isCancelled) {
        return;
      }

      setIsSearchingRecipes(false);

      if (error) {
        setRecipeSearchResults([]);
        setRecipeSearchFeedback('No se pudo buscar recetas.');
        return;
      }

      setRecipeSearchResults(data || []);
      if ((data || []).length === 0) {
        setRecipeSearchFeedback('No se encontraron recetas.');
      }
    }, 280);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [
    activeTab,
    cookbookSearchQuery,
    recipeSearchScope,
    selectedCookbookForView,
    userId,
  ]);

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

  const normalizeRecipeStepPhotos = (additionalPhotos, stepCount) => {
    let sourcePhotos = additionalPhotos;
    if (typeof additionalPhotos === 'string') {
      try {
        const parsed = JSON.parse(additionalPhotos);
        sourcePhotos = Array.isArray(parsed) ? parsed : [];
      } catch (_error) {
        sourcePhotos = [];
      }
    }

    const normalizedSource = Array.isArray(sourcePhotos)
      ? sourcePhotos.map((item) => String(item || '').trim())
      : [];
    const targetCount = Math.max(1, Number(stepCount) || 0);
    return Array.from({ length: targetCount }, (_, index) => normalizedSource[index] || '');
  };

  const buildRecipeDetailDraft = (recipe) => {
    const { descriptionText, ingredients } = splitRecipeDescription(recipe?.description || '');
    const normalizedSteps = normalizeRecipeSteps(recipe?.steps, recipe?.instructions);
    const normalizedStepPhotos = normalizeRecipeStepPhotos(
      recipe?.additional_photos,
      normalizedSteps.length > 0 ? normalizedSteps.length : 1
    );

    return {
      title: recipe?.name || '',
      description: descriptionText,
      ingredients: ingredients.length > 0 ? ingredients : [''],
      steps: normalizedSteps.length > 0 ? normalizedSteps : [''],
      stepPhotos: normalizedStepPhotos,
      mainPhotoUrl: recipe?.main_photo_url || '',
      isPublic: Boolean(recipe?.is_public),
    };
  };

  const hasRecipeDetailPayload = (recipe) => {
    if (!recipe || typeof recipe !== 'object') {
      return false;
    }

    const hasStepsField = Object.prototype.hasOwnProperty.call(recipe, 'steps');
    const hasInstructionsField = Object.prototype.hasOwnProperty.call(recipe, 'instructions');
    if (!hasStepsField && !hasInstructionsField) {
      return false;
    }

    if (Array.isArray(recipe.steps) && recipe.steps.length > 0) {
      return true;
    }

    if (typeof recipe.instructions === 'string' && recipe.instructions.trim().length > 0) {
      return true;
    }

    return hasStepsField || hasInstructionsField;
  };

  const fetchRecipeDetailsById = async (recipeId) => {
    if (!recipeId || !supabase || !isSupabaseConfigured) {
      return null;
    }

    const { data, error } = await supabase
      .from('recipes')
      .select(
        'id, owner_user_id, name, description, main_photo_url, additional_photos, steps, instructions, is_public, source_url'
      )
      .eq('id', recipeId)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  };

  const ensureRecipeDetailsLoaded = async (recipe) => {
    if (!recipe?.id) {
      return recipe;
    }

    const recipeKey = String(recipe.id);
    const cachedRecipe = recipeDetailsCacheRef.current[recipeKey];
    if (cachedRecipe) {
      return {
        ...recipe,
        ...cachedRecipe,
      };
    }

    if (hasRecipeDetailPayload(recipe)) {
      recipeDetailsCacheRef.current[recipeKey] = recipe;
      return recipe;
    }

    const fetchedRecipe = await fetchRecipeDetailsById(recipe.id);
    if (fetchedRecipe) {
      const mergedRecipe = {
        ...recipe,
        ...fetchedRecipe,
      };
      recipeDetailsCacheRef.current[recipeKey] = mergedRecipe;
      return mergedRecipe;
    }

    return recipe;
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
  const normalizeRecipeIngredientText = (value) =>
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/^\s*[-•]\s*/, '');

  const selectedRecipeCookbookNames = useMemo(() => {
    if (!selectedRecipeForView?.id) {
      return [];
    }

    return cookbooks
      .filter((cookbook) =>
        (cookbook.recipes || []).some((recipe) => String(recipe.id) === String(selectedRecipeForView.id))
      )
      .map((cookbook) => (cookbook.name || '').trim())
      .filter((name) => Boolean(name));
  }, [cookbooks, selectedRecipeForView]);

  const selectedRecipeCookbookSummary = useMemo(() => {
    if (!selectedRecipeForView?.id) {
      return 'Sin receta seleccionada.';
    }

    return selectedRecipeCookbookNames.length > 0
      ? selectedRecipeCookbookNames.join(', ')
      : 'Sin recetario';
  }, [selectedRecipeForView, selectedRecipeCookbookNames]);

  const selectedRecipePlannedSlots = useMemo(() => {
    if (!selectedRecipeForView?.id) {
      return [];
    }

    const normalizedRecipeId = String(selectedRecipeForView.id);
    const planSlotRows = [];

    Object.entries(mealPlansByDate).forEach(([planDate, planRow]) => {
      if (!planRow) {
        return;
      }

      const dayLabel = (() => {
        const parsedDate = parseIsoDate(planDate);
        if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
          return planDate;
        }

        const dateFormatter = new Intl.DateTimeFormat('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
        });
        return dateFormatter.format(parsedDate);
      })();

      const slotLabels = [];
      if (String(planRow.breakfast_recipe_id) === normalizedRecipeId) {
        slotLabels.push('Desayuno');
      }
      if (String(planRow.snack_recipe_id) === normalizedRecipeId) {
        slotLabels.push('Snack');
      }
      if (String(planRow.lunch_recipe_id) === normalizedRecipeId) {
        slotLabels.push('Almuerzo');
      }
      if (String(planRow.dinner_recipe_id) === normalizedRecipeId) {
        slotLabels.push('Cena');
      }

      if (slotLabels.length > 0) {
        planSlotRows.push(`${dayLabel}: ${slotLabels.join(', ')}`);
      }
    });

    return planSlotRows;
  }, [mealPlansByDate, selectedRecipeForView]);

  const selectedRecipeShoppingIngredientCoverage = useMemo(() => {
    if (!selectedRecipeForView?.id) {
      return [];
    }

    const recipeName = normalizeRecipeIngredientText(selectedRecipeForView?.name || recipeDetailDraft.title || '');
    const normalizedRecipeIngredients = (recipeDetailDraft.ingredients || [])
      .map((item) => normalizeRecipeIngredientText(item))
      .filter((item) => item.length > 0);

    if (normalizedRecipeIngredients.length === 0 || shoppingItems.length === 0) {
      return [];
    }

    const ingredientsInList = new Set();
    shoppingItems.forEach((item) => {
      if (!item || item.is_completed) {
        return;
      }

      const { displayName, sourceRecipeName } = decodeShoppingItemName(item.name);
      const normalizedSource = normalizeRecipeIngredientText(sourceRecipeName);
      const normalizedDisplay = normalizeRecipeIngredientText(displayName);
      if (
        normalizedSource &&
        recipeName &&
        (normalizedSource === recipeName || normalizedSource.includes(recipeName) || recipeName.includes(normalizedSource))
      ) {
        ingredientsInList.add(normalizedDisplay);
        return;
      }

      if (
        normalizedDisplay &&
        normalizedRecipeIngredients.some(
          (ingredient) =>
            normalizedDisplay === ingredient ||
            normalizedDisplay.includes(ingredient) ||
            ingredient.includes(normalizedDisplay)
        )
      ) {
        ingredientsInList.add(normalizedDisplay);
      }
    });

    return Array.from(ingredientsInList).filter((itemName) => Boolean(itemName));
  }, [recipeDetailDraft.ingredients, recipeDetailDraft.title, selectedRecipeForView?.id, shoppingItems]);
  const planMealOptions = useMemo(
    () => [
      { key: 'desayuno', label: 'Desayuno', column: 'breakfast_recipe_id' },
      { key: 'snack', label: 'Snack', column: 'snack_recipe_id' },
      { key: 'almuerzo', label: 'Almuerzo', column: 'lunch_recipe_id' },
      { key: 'cena', label: 'Cena', column: 'dinner_recipe_id' },
    ],
    []
  );
  const filteredPlanRecipeOptions = useMemo(() => {
    const query = planRecipeSearchQuery.trim().toLowerCase();
    if (!query) {
      return planRecipeOptions;
    }
    return planRecipeOptions.filter((recipe) =>
      String(recipe?.name || '')
        .toLowerCase()
        .includes(query)
    );
  }, [planRecipeOptions, planRecipeSearchQuery]);

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

  const recipeSearchScopeOptions = useMemo(
    () => [
      { key: 'mine', label: 'Mis recetas' },
      { key: 'savemydish', label: 'SaveMyDish' },
      { key: 'all', label: 'Todo' },
    ],
    []
  );

  const recipeSearchPlaceholder = useMemo(() => {
    if (recipeSearchScope === 'mine') {
      return 'Buscar en Mis recetas...';
    }

    if (recipeSearchScope === 'savemydish') {
      return 'Buscar en SaveMyDish...';
    }

    return 'Buscar en Todo...';
  }, [recipeSearchScope]);

  const handleAddCookbook = async (nameOverride = '') => {
    const name = String(nameOverride || '').trim();
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

    const nextCreatedCookbook = {
      ...data,
      recipeCount: 0,
      previewRecipes: [],
    };
    setCookbooks((prevCookbooks) => {
      const nextCookbooks = [nextCreatedCookbook, ...prevCookbooks];
      const nextTimestamp = Date.now();
      lastCookbooksLoadAtRef.current = nextTimestamp;
      AsyncStorage.setItem(
        `smd:cookbooks:${userId}`,
        JSON.stringify({
          timestamp: nextTimestamp,
          cookbooks: nextCookbooks,
        })
      ).catch(() => {});
      return nextCookbooks;
    });
    setNewCookbookName('');
    setIsCreateCookbookSheetOpen(false);
  };

  const handleOpenNewCookbookCard = () => {
    if (isMutatingCookbooks) {
      return;
    }

    setCookbookFeedback('');
    setNewCookbookName('');
    setIsCreateCookbookSheetOpen(true);
  };

  const closeCreateCookbookSheet = () => {
    if (isMutatingCookbooks) {
      return;
    }

    setIsCreateCookbookSheetOpen(false);
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

  const persistRecipeViewFeedback = useCallback(
    async (recipeId, nextValues = {}) => {
      if (!supabase || !isSupabaseConfigured || !userId || !recipeId) {
        return;
      }

      const recipeIdNumber = Number(recipeId);
      if (!Number.isFinite(recipeIdNumber)) {
        return;
      }

      const key = String(recipeId);
      const nextIsCooked =
        typeof nextValues.is_cooked === 'boolean'
          ? nextValues.is_cooked
          : Boolean(recipeCookedById[key]);
      const rawRating =
        nextValues.rating === undefined ? Number(recipeRatingById[key] || 0) : Number(nextValues.rating || 0);
      const nextRating = Math.max(0, Math.min(5, Number.isFinite(rawRating) ? rawRating : 0));
      const nextNote =
        nextValues.note === undefined ? String(recipeNoteById[key] || '') : String(nextValues.note || '');

      const { error } = await supabase.from('recipe_user_feedback').upsert(
        {
          user_id: userId,
          recipe_id: recipeIdNumber,
          is_cooked: nextIsCooked,
          rating: nextRating,
          note: nextNote,
        },
        { onConflict: 'user_id,recipe_id' }
      );

      if (error) {
        setRecipeDetailFeedback('No se pudo guardar calificación/nota.');
      }
    },
    [recipeCookedById, recipeNoteById, recipeRatingById, userId]
  );

  const loadRecipeViewFeedback = useCallback(
    async (recipeId) => {
      if (!supabase || !isSupabaseConfigured || !userId || !recipeId) {
        return;
      }

      const recipeIdNumber = Number(recipeId);
      if (!Number.isFinite(recipeIdNumber)) {
        return;
      }

      const { data, error } = await supabase
        .from('recipe_user_feedback')
        .select('is_cooked, rating, note')
        .eq('user_id', userId)
        .eq('recipe_id', recipeIdNumber)
        .maybeSingle();

      if (error) {
        return;
      }

      const key = String(recipeId);
      setRecipeCookedById((prevValue) => ({
        ...prevValue,
        [key]: Boolean(data?.is_cooked),
      }));
      setRecipeRatingById((prevValue) => ({
        ...prevValue,
        [key]: Number(data?.rating || 0),
      }));
      setRecipeNoteById((prevValue) => ({
        ...prevValue,
        [key]: String(data?.note || ''),
      }));
    },
    [userId]
  );

  useEffect(() => {
    if (recipeDetailMode !== 'view' || !selectedRecipeForView?.id) {
      return;
    }

    loadRecipeViewFeedback(selectedRecipeForView.id);
  }, [loadRecipeViewFeedback, recipeDetailMode, selectedRecipeForView?.id]);

  const escapeRecipePdfHtml = (value) =>
    String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const handleExportRecipePdf = async () => {
    if (!selectedRecipeForView) {
      return;
    }

    const recipeTitle = String(recipeDetailDraft.title || selectedRecipeForView.name || 'Receta').trim() || 'Receta';
    const recipeDescription = String(recipeDetailDraft.description || '').trim();
    const recipeIngredients = (recipeDetailDraft.ingredients || [])
      .map((item) => String(item || '').trim())
      .filter((item) => item.length > 0);
    const recipeSteps = (recipeDetailDraft.steps || [])
      .map((item) => String(item || '').trim())
      .filter((item) => item.length > 0);

    const ingredientsHtml = recipeIngredients
      .map((item) => `<li>${escapeRecipePdfHtml(item)}</li>`)
      .join('');
    const stepsHtml = recipeSteps
      .map((item) => `<li>${escapeRecipePdfHtml(item)}</li>`)
      .join('');

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              padding: 28px;
              color: #111827;
              line-height: 1.45;
            }
            .title {
              margin: 0 0 12px 0;
              font-size: 30px;
              font-weight: 700;
            }
            .section-title {
              margin: 18px 0 8px 0;
              font-size: 16px;
              font-weight: 700;
            }
            p { margin: 0; font-size: 14px; }
            li { font-size: 14px; margin-bottom: 6px; }
            ul, ol { margin: 8px 0 0 20px; padding: 0; }
            .footer {
              margin-top: 24px;
              font-size: 11px;
              color: #6B7280;
            }
          </style>
        </head>
        <body>
          <h1 class="title">${escapeRecipePdfHtml(recipeTitle)}</h1>
          <h2 class="section-title">Descripción</h2>
          <p>${escapeRecipePdfHtml(recipeDescription || 'Sin descripción.')}</p>
          <h2 class="section-title">Ingredientes</h2>
          ${recipeIngredients.length > 0 ? `<ul>${ingredientsHtml}</ul>` : '<p>Sin ingredientes.</p>'}
          <h2 class="section-title">Pasos</h2>
          ${recipeSteps.length > 0 ? `<ol>${stepsHtml}</ol>` : '<p>Sin pasos.</p>'}
          <p class="footer">Generado por SaveMyDish</p>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });

      if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartir receta en PDF',
          UTI: 'com.adobe.pdf',
        });
      } else {
        await Share.share({
          message: `Receta: ${recipeTitle}`,
          url: uri,
        });
      }

      setRecipeDetailFeedback('PDF generado correctamente.');
    } catch (_error) {
      setRecipeDetailFeedback('No se pudo exportar PDF.');
    }
  };

  const handleDeleteSelectedRecipe = async () => {
  const handleShareRecipeLink = async (recipeNameValue, onErrorMessage) => {
    const recipeName = String(recipeNameValue || '').trim() || 'Receta';
    const appUrl = 'https://www.savemydish.com';
    const message = `Hey! Mira esta receta: ${recipeName}. Quiero compartírtela en SaveMyDish, sé que te va a encantar.\n\n${appUrl}`;

    try {
      await Share.share({
        title: 'SaveMyDish',
        message,
        url: appUrl,
      });
    } catch (_error) {
      if (typeof onErrorMessage === 'function') {
        onErrorMessage('No se pudo abrir compartir en este dispositivo.');
      }
    }
  };

  const handleDeleteSelectedRecipe = async () => {
    if (!supabase || !isSupabaseConfigured || !selectedRecipeForView?.id || !canEditSelectedRecipe) {
      return;
    }

    const cookbookIdToKeep = selectedCookbookForView?.id;
    setIsDeletingRecipe(true);
    setRecipeDetailFeedback('');
    const recipeId = selectedRecipeForView.id;

    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipeId)
      .eq('owner_user_id', userId);

    if (error) {
      setIsDeletingRecipe(false);
      setRecipeDetailFeedback('No se pudo borrar la receta.');
      return;
    }

    const feedbackKey = String(recipeId);
    delete recipeDetailsCacheRef.current[feedbackKey];
    setRecipeCookedById((prevValue) => {
      const nextValue = { ...prevValue };
      delete nextValue[feedbackKey];
      return nextValue;
    });
    setRecipeRatingById((prevValue) => {
      const nextValue = { ...prevValue };
      delete nextValue[feedbackKey];
      return nextValue;
    });
    setRecipeNoteById((prevValue) => {
      const nextValue = { ...prevValue };
      delete nextValue[feedbackKey];
      return nextValue;
    });

    closeRecipeDetailView();
    await refreshCookbooksAndSelectedCookbook(cookbookIdToKeep);
    setIsDeletingRecipe(false);
    setCookbookViewFeedback('Receta eliminada correctamente.');
  };

  const handleConfirmDeleteSelectedRecipe = () => {
    if (!selectedRecipeForView || !canEditSelectedRecipe || isDeletingRecipe) {
      return;
    }
    setIsRecipeDeleteConfirmOpen(true);
  };

  const handleOpenRecipeMoreOptions = () => {
    if (!selectedRecipeForView || !canEditSelectedRecipe || isDeletingRecipe) {
      return;
    }
    setIsRecipeMoreDropdownOpen((prevValue) => !prevValue);
  };

  const renderRecipeDetailView = () => {
    const isEditingRecipeDetail = recipeDetailMode === 'edit';
    const recipeSourceUrl = String(selectedRecipeForView?.source_url || '').trim();
    const selectedRecipeIdKey = String(selectedRecipeForView?.id || '');
    const isRecipeMarkedCooked = Boolean(recipeCookedById[selectedRecipeIdKey]);
    const recipeRating = Number(recipeRatingById[selectedRecipeIdKey] || 0);
    const recipeNote = String(recipeNoteById[selectedRecipeIdKey] || '');
    const recipeHeroContent = recipeDetailDraft.mainPhotoUrl ? (
      <Image
        source={{ uri: recipeDetailDraft.mainPhotoUrl }}
        style={styles.recipeDetailHeroImage}
        resizeMode="cover"
      />
    ) : (
      <View style={styles.recipeDetailHeroPlaceholder}>
        <Ionicons name="image-outline" size={34} color={palette.accent} />
      </View>
    );

    return (
      <View>
        <View style={styles.recipeDetailTopRow}>
          <TouchableOpacity style={styles.cookbookBackAction} onPress={closeRecipeDetailView}>
            <Ionicons name="chevron-back" size={18} color={palette.accent} />
            <Text style={styles.cookbookBackActionText}>{selectedCookbookForView?.name || 'Recetas'}</Text>
          </TouchableOpacity>

          {canEditSelectedRecipe ? (
            isEditingRecipeDetail ? (
              <View style={styles.recipeDetailEditActions}>
                <TouchableOpacity
                  style={[styles.recipeDetailEditButton, isSavingRecipeDetail && styles.buttonDisabled]}
                  onPress={handleCancelRecipeDetailEdit}
                  disabled={isSavingRecipeDetail}
                >
                  <Text style={styles.recipeDetailEditButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.recipeDetailEditButton,
                    styles.recipeDetailEditButtonPrimary,
                    isSavingRecipeDetail && styles.buttonDisabled,
                  ]}
                  onPress={handleSaveRecipeDetail}
                  disabled={isSavingRecipeDetail}
                >
                  <Text style={[styles.recipeDetailEditButtonText, styles.recipeDetailEditButtonTextPrimary]}>
                    {isSavingRecipeDetail ? 'Guardando...' : 'Guardar'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.recipeDetailEditMenuRow}>
                <TouchableOpacity
                  style={[styles.recipeDetailEditButton, isDeletingRecipe && styles.buttonDisabled]}
                  onPress={() => {
                    setIsRecipeMoreDropdownOpen(false);
                    handleOpenManualRecipeEditForm();
                  }}
                  disabled={isDeletingRecipe}
                >
                  <Text style={styles.recipeDetailEditButtonText}>Editar</Text>
                </TouchableOpacity>
                <View style={styles.recipeDetailMoreMenuWrap}>
                  <TouchableOpacity
                    style={[styles.recipeDetailMoreButton, isDeletingRecipe && styles.buttonDisabled]}
                    onPress={handleOpenRecipeMoreOptions}
                    disabled={isDeletingRecipe}
                  >
                    <Ionicons name="ellipsis-horizontal" size={18} color={palette.accent} />
                  </TouchableOpacity>

                  {isRecipeMoreDropdownOpen ? (
                    <View style={styles.recipeDetailMoreMenuDropdown}>
                      <TouchableOpacity
                        style={styles.recipeDetailMoreMenuItem}
                        onPress={() => {
                          setIsRecipeMoreDropdownOpen(false);
                          void handleExportRecipePdf();
                        }}
                        disabled={isDeletingRecipe}
                      >
                        <Text style={styles.recipeDetailMoreMenuItemText}>Exportar</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.recipeDetailMoreMenuItem}
                        onPress={() => {
                          setIsRecipeMoreDropdownOpen(false);
                          handleConfirmDeleteSelectedRecipe();
                        }}
                        disabled={isDeletingRecipe}
                      >
                        <Text
                          style={[
                            styles.recipeDetailMoreMenuItemText,
                            styles.recipeDetailMoreMenuItemTextDanger,
                          ]}
                        >
                          Borrar
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              </View>
            )
          ) : null}
        </View>

        <View style={styles.recipeDetailHero}>
          {isEditingRecipeDetail ? (
            <View style={styles.recipeDetailHeroTouchable}>
              {recipeHeroContent}
              <View style={styles.recipeDetailPhotoQuickActions}>
                <TouchableOpacity
                  style={[styles.recipeDetailPhotoQuickAction, isSavingRecipeDetail && styles.buttonDisabled]}
                  onPress={() => {
                    void handlePickRecipeDetailPhotoFromSource('camera');
                  }}
                  disabled={isSavingRecipeDetail}
                >
                  <Ionicons name="camera-outline" size={14} color={palette.accent} />
                  <Text style={styles.recipeDetailPhotoQuickActionText}>Tomar foto</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.recipeDetailPhotoQuickAction, isSavingRecipeDetail && styles.buttonDisabled]}
                  onPress={() => {
                    void handlePickRecipeDetailPhoto();
                  }}
                  disabled={isSavingRecipeDetail}
                >
                  <Ionicons name="images-outline" size={14} color={palette.accent} />
                  <Text style={styles.recipeDetailPhotoQuickActionText}>Elegir de galería</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.recipeDetailHeroTouchable}>{recipeHeroContent}</View>
          )}
        </View>

        <View style={styles.recipeDetailTitleBar}>
          {isEditingRecipeDetail ? (
            <TextInput
              style={styles.recipeDetailTitleInput}
              value={recipeDetailDraft.title}
              onChangeText={(value) =>
                setRecipeDetailDraft((prevDraft) => ({
                  ...prevDraft,
                  title: value,
                }))
              }
              placeholder="Título..."
              placeholderTextColor="#D6E2F2"
              editable={!isSavingRecipeDetail}
            />
          ) : (
            <Text style={styles.recipeDetailTitleText}>{recipeDetailDraft.title || 'Sin título'}</Text>
          )}
        </View>

        <View style={styles.recipeDetailInfoBox}>
          <View style={styles.recipeDetailInfoRow}>
            <Ionicons name="book-outline" size={16} color={palette.accent} />
            <Text style={styles.recipeDetailInfoText}>{selectedRecipeCookbookSummary}</Text>
          </View>

          <View style={styles.recipeDetailInfoRow}>
            <Ionicons name="calendar-outline" size={16} color={palette.accent} />
            <Text style={styles.recipeDetailInfoText}>
              {selectedRecipePlannedSlots.length > 0
                ? selectedRecipePlannedSlots.join(' · ')
                : 'Sin planificar en la semana cargada.'}
            </Text>
          </View>

          <View style={styles.recipeDetailInfoRow}>
            <Ionicons
              name={(isEditingRecipeDetail ? recipeDetailDraft.isPublic : selectedRecipeForView?.is_public)
                ? 'globe-outline'
                : 'lock-closed-outline'}
              size={16}
              color={palette.accent}
            />
            <Text style={styles.recipeDetailInfoText}>
              {(isEditingRecipeDetail ? recipeDetailDraft.isPublic : selectedRecipeForView?.is_public)
                ? 'Receta pública'
                : 'Receta privada'}
            </Text>
          </View>

          <View style={styles.recipeDetailInfoRow}>
            <Ionicons name="cart-outline" size={16} color={palette.accent} />
            <Text style={styles.recipeDetailInfoText}>
              {selectedRecipeShoppingIngredientCoverage.length > 0
                ? `${selectedRecipeShoppingIngredientCoverage.length} ingredientes pendientes`
                : 'Sin ingredientes pendientes'}
            </Text>
          </View>

          {recipeSourceUrl ? (
            <TouchableOpacity
              style={[styles.recipeDetailInfoRow, styles.recipeDetailSourceRow]}
              onPress={() => {
                Linking.openURL(recipeSourceUrl).catch(() => {
                  setRecipeDetailFeedback('No se pudo abrir el enlace de origen.');
                });
              }}
              activeOpacity={0.75}
            >
              <Ionicons name="link-outline" size={16} color={palette.accent} />
              <Text style={[styles.recipeDetailInfoText, styles.recipeDetailSourceText]}>
                Origen
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {!isEditingRecipeDetail ? (
          <View style={styles.recipeViewActionsCard}>
            <View style={styles.recipeViewActionsHeader}>
              <TouchableOpacity
                style={styles.recipeCookedToggleButton}
                activeOpacity={0.8}
                onPress={() => {
                  if (!selectedRecipeIdKey) {
                    return;
                  }
                  const nextIsCooked = !isRecipeMarkedCooked;
                  setRecipeCookedById((prevValue) => ({
                    ...prevValue,
                    [selectedRecipeIdKey]: nextIsCooked,
                  }));
                  void persistRecipeViewFeedback(selectedRecipeIdKey, {
                    is_cooked: nextIsCooked,
                    rating: recipeRating,
                    note: recipeNote,
                  });
                }}
              >
                <Text style={styles.recipeCookedToggleText}>Marcar como cocinado</Text>
                <View
                  style={[
                    styles.recipeCookedToggleIconWrap,
                    isRecipeMarkedCooked && styles.recipeCookedToggleIconWrapActive,
                  ]}
                >
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color={isRecipeMarkedCooked ? palette.card : '#AFAAA2'}
                  />
                </View>
              </TouchableOpacity>

              <View style={styles.recipeRatingStarsWrap}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <TouchableOpacity
                    key={`recipe-rating-${value}`}
                    activeOpacity={0.75}
                    onPress={() => {
                      if (!selectedRecipeIdKey) {
                        return;
                      }
                      const nextRating = recipeRating === value ? 0 : value;
                      setRecipeRatingById((prevValue) => ({
                        ...prevValue,
                        [selectedRecipeIdKey]: nextRating,
                      }));
                      void persistRecipeViewFeedback(selectedRecipeIdKey, {
                        is_cooked: isRecipeMarkedCooked,
                        rating: nextRating,
                        note: recipeNote,
                      });
                    }}
                  >
                    <Ionicons
                      name={value <= recipeRating ? 'star' : 'star-outline'}
                      size={18}
                      color={value <= recipeRating ? '#C7B073' : '#DDD8D0'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              style={styles.recipeCookedNoteInput}
              value={recipeNote}
              onChangeText={(value) => {
                if (!selectedRecipeIdKey) {
                  return;
                }
                setRecipeNoteById((prevValue) => ({
                  ...prevValue,
                  [selectedRecipeIdKey]: value,
                }));
              }}
              placeholder="Añadir nota"
              placeholderTextColor="#AFAAA2"
              multiline
              textAlignVertical="top"
              onEndEditing={() => {
                if (!selectedRecipeIdKey) {
                  return;
                }

                void persistRecipeViewFeedback(selectedRecipeIdKey, {
                  is_cooked: isRecipeMarkedCooked,
                  rating: recipeRating,
                  note: recipeNote,
                });
              }}
            />
          </View>
        ) : null}

        {isEditingRecipeDetail ? (
          <TouchableOpacity
            style={styles.recipeVisibilityToggle}
            onPress={() =>
              setRecipeDetailDraft((prevDraft) => ({
                ...prevDraft,
                isPublic: !prevDraft.isPublic,
              }))
            }
            disabled={isSavingRecipeDetail}
          >
            <Text style={styles.recipeVisibilityToggleText}>
              {recipeDetailDraft.isPublic ? 'Cambiar a Privada' : 'Cambiar a Pública'}
            </Text>
          </TouchableOpacity>
        ) : null}

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
                <Ionicons name="basket-outline" size={20} color={palette.accent} />
              </View>
              <Text style={styles.manualQuickActionText}>Lista</Text>
            </TouchableOpacity>
              <TouchableOpacity
                style={styles.manualQuickAction}
                onPress={() => {
                  void handleShareRecipeLink(
                    selectedRecipeForView?.name || recipeDetailDraft?.title || 'Receta',
                    setRecipeDetailFeedback
                  );
                }}
              >
                <View style={styles.manualQuickActionIcon}>
                  <Ionicons name="share-social-outline" size={20} color={palette.accent} />
                </View>
                <Text style={styles.manualQuickActionText}>Compartir</Text>
            </TouchableOpacity>
          </View>

          {isEditingRecipeDetail || recipeDetailDraft.description ? (
            <View style={styles.recipeDetailDescriptionWrap}>
              {isEditingRecipeDetail ? (
                <TextInput
                  style={styles.recipeDetailDescriptionInput}
                  value={recipeDetailDraft.description}
                  onChangeText={(value) =>
                    setRecipeDetailDraft((prevDraft) => ({
                      ...prevDraft,
                      description: value,
                    }))
                  }
                  placeholder="Agrega una descripcion breve..."
                  placeholderTextColor={palette.mutedText}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  editable={!isSavingRecipeDetail}
                />
              ) : (
                <Text style={styles.recipeDetailDescription}>{recipeDetailDraft.description}</Text>
              )}
            </View>
          ) : null}

          <Text style={styles.manualSectionTitle}>Ingredientes</Text>
          {recipeDetailDraft.ingredients.map((item, index) => (
            <View key={`detail-ingredient-${index}`} style={styles.manualListRow}>
              {isEditingRecipeDetail ? (
                <TouchableOpacity
                  style={[
                    styles.manualDeleteItemButton,
                    (recipeDetailDraft.ingredients.length <= 1 || isSavingRecipeDetail) && styles.buttonDisabled,
                  ]}
                  onPress={() => removeRecipeDraftIngredient(index)}
                  disabled={recipeDetailDraft.ingredients.length <= 1 || isSavingRecipeDetail}
                >
                  <Ionicons name="remove-circle-outline" size={18} color="#8B9AAA" />
                </TouchableOpacity>
              ) : (
                <Text style={styles.recipeDetailBullet}>•</Text>
              )}

              {isEditingRecipeDetail ? (
                <TextInput
                  style={styles.manualListInput}
                  value={item}
                  onChangeText={(value) => updateRecipeDraftIngredient(index, value)}
                  placeholder="Agregar ingrediente..."
                  placeholderTextColor={palette.mutedText}
                  editable={!isSavingRecipeDetail}
                />
              ) : (
                <Text style={styles.recipeDetailReadText}>{item || '-'}</Text>
              )}
            </View>
          ))}
          {isEditingRecipeDetail ? (
            <TouchableOpacity
              style={[styles.manualAddMiniButton, isSavingRecipeDetail && styles.buttonDisabled]}
              onPress={addRecipeDraftIngredient}
              disabled={isSavingRecipeDetail}
            >
              <Ionicons name="add" size={18} color={palette.card} />
            </TouchableOpacity>
          ) : null}

          <View style={styles.recipeDetailStepsHeaderRow}>
            <Text style={styles.manualSectionTitle}>Instrucciones</Text>
            {isEditingRecipeDetail ? (
              <TouchableOpacity
                style={styles.recipeDetailReorderButton}
                onPress={() => {
                  setIsRecipeStepReorderMode((prevValue) => !prevValue);
                  setDraggingRecipeStepIndex(null);
                }}
                disabled={isSavingRecipeDetail}
              >
                <Text style={styles.recipeDetailReorderText}>
                  {isRecipeStepReorderMode ? 'Listo' : 'Reordenar'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {recipeDetailDraft.steps.map((item, index) => {
            const stepPhotoUrl = String(recipeDetailDraft.stepPhotos?.[index] || '').trim();
            const stepDragResponder =
              isEditingRecipeDetail && isRecipeStepReorderMode
                ? PanResponder.create({
                    onStartShouldSetPanResponder: () => !isSavingRecipeDetail,
                    onMoveShouldSetPanResponder: (_evt, gestureState) =>
                      !isSavingRecipeDetail && Math.abs(gestureState.dy) > 4,
                    onPanResponderGrant: () => {
                      setDraggingRecipeStepIndex(index);
                      stepDragStateRef.current = { currentIndex: index, lastSwapTs: 0 };
                    },
                    onPanResponderMove: (_evt, gestureState) => {
                      if (isSavingRecipeDetail) {
                        return;
                      }

                      const now = Date.now();
                      const currentDrag = stepDragStateRef.current;
                      if (now - currentDrag.lastSwapTs < 120) {
                        return;
                      }

                      const currentIndex = currentDrag.currentIndex;
                      if (
                        gestureState.dy <= -26 &&
                        currentIndex > 0
                      ) {
                        moveRecipeDraftStep(currentIndex, currentIndex - 1);
                        stepDragStateRef.current = {
                          currentIndex: currentIndex - 1,
                          lastSwapTs: now,
                        };
                        return;
                      }

                      if (
                        gestureState.dy >= 26 &&
                        currentIndex < recipeDetailDraft.steps.length - 1
                      ) {
                        moveRecipeDraftStep(currentIndex, currentIndex + 1);
                        stepDragStateRef.current = {
                          currentIndex: currentIndex + 1,
                          lastSwapTs: now,
                        };
                      }
                    },
                    onPanResponderRelease: () => {
                      setDraggingRecipeStepIndex(null);
                      stepDragStateRef.current = { currentIndex: -1, lastSwapTs: 0 };
                    },
                    onPanResponderTerminate: () => {
                      setDraggingRecipeStepIndex(null);
                      stepDragStateRef.current = { currentIndex: -1, lastSwapTs: 0 };
                    },
                  })
                : null;
            return (
              <View key={`detail-step-${index}`} style={styles.recipeDetailStepCard}>
                <TouchableOpacity
                  style={[styles.recipeDetailStepPhotoTile, isSavingRecipeDetail && styles.buttonDisabled]}
                  onPress={() => {
                    if (!isEditingRecipeDetail) {
                      return;
                    }
                    void handlePickRecipeDetailStepPhoto(index);
                  }}
                  disabled={!isEditingRecipeDetail || isSavingRecipeDetail}
                  activeOpacity={0.85}
                >
                  {stepPhotoUrl ? (
                    <Image
                      source={{ uri: stepPhotoUrl }}
                      style={styles.recipeDetailStepPhotoTileImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons name="camera-outline" size={18} color={palette.accent} />
                  )}
                </TouchableOpacity>

                <View style={styles.recipeDetailStepCardContent}>
                  <View style={styles.recipeDetailStepTextRow}>
                    <Text style={styles.recipeDetailStepIndexText}>{index + 1}.</Text>
                    {isEditingRecipeDetail ? (
                      <TextInput
                        style={styles.recipeDetailStepCardInput}
                        value={item}
                        onChangeText={(value) => updateRecipeDraftStep(index, value)}
                        placeholder="Agregar preparación..."
                        placeholderTextColor="#9EA5B8"
                        editable={!isSavingRecipeDetail}
                        multiline
                      />
                    ) : (
                      <Text style={styles.recipeDetailStepCardText}>{item || '-'}</Text>
                    )}
                  </View>

                  {isEditingRecipeDetail ? (
                    <View style={styles.recipeDetailStepCardFooter}>
                      {isRecipeStepReorderMode ? (
                        <View style={styles.recipeDetailStepDragArea}>
                          <View
                            style={[
                              styles.recipeDetailStepDragHandle,
                              draggingRecipeStepIndex === index && styles.recipeDetailStepDragHandleActive,
                              isSavingRecipeDetail && styles.buttonDisabled,
                            ]}
                            {...(stepDragResponder ? stepDragResponder.panHandlers : {})}
                          >
                            <Ionicons name="reorder-three-outline" size={18} color={palette.accent} />
                          </View>
                        </View>
                      ) : null}

                      <TouchableOpacity
                        style={[
                          styles.recipeDetailStepRemoveButton,
                          (recipeDetailDraft.steps.length <= 1 || isSavingRecipeDetail) && styles.buttonDisabled,
                        ]}
                        onPress={() => removeRecipeDraftStep(index)}
                        disabled={recipeDetailDraft.steps.length <= 1 || isSavingRecipeDetail}
                      >
                        <Ionicons name="trash-outline" size={15} color="#8B9AAA" />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}

          {isEditingRecipeDetail ? (
            <TouchableOpacity
              style={[styles.recipeDetailAddStepButton, isSavingRecipeDetail && styles.buttonDisabled]}
              onPress={addRecipeDraftStep}
              disabled={isSavingRecipeDetail}
            >
              <Ionicons name="add" size={16} color={palette.accent} />
              <Text style={styles.recipeDetailAddStepButtonText}>Agregar paso</Text>
            </TouchableOpacity>
          ) : null}

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
            {selectedCookbookForView.recipes.map((recipe) => {
              const recipeDescriptionPreview =
                splitRecipeDescription(recipe.description || '').descriptionText ||
                String(recipe.description || '').trim() ||
                'Sin descripción';

              return (
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

                  <View style={styles.recipeSearchResultContent}>
                    <Text style={styles.cookbookRecipeName}>{recipe.name}</Text>
                    <Text style={styles.cookbookRecipeDescription} numberOfLines={2}>
                      {recipeDescriptionPreview}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyText}>Este recetario aún no tiene recetas.</Text>
        )}
      </View>
    );
  };

  const renderRecetasView = () => {
    const hasSearchQuery = cookbookSearchQuery.trim().length > 0;

    return (
      <View>
        {selectedCookbookForView ? (
          renderCookbookRecipesView()
        ) : (
          <>
            <Text style={styles.title}>Recetarios</Text>
            <Text style={styles.body}>
              Tus recetarios son privados. Solo las recetas pueden publicarse si tú lo decides.
            </Text>

            {!isSupabaseConfigured ? (
              <View style={styles.warningCard}>
                <Text style={styles.warningText}>
                  Configura `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` para usar recetarios.
                </Text>
              </View>
            ) : null}

            <View style={styles.recipesSearchWrap}>
              <View style={styles.recipeSearchInputWrap}>
                <TextInput
                  style={styles.recipesSearchInput}
                  placeholder={recipeSearchPlaceholder}
                  placeholderTextColor={palette.mutedText}
                  value={cookbookSearchQuery}
                  onChangeText={setCookbookSearchQuery}
                  editable={!isMutatingCookbooks}
                  returnKeyType="search"
                  onFocus={() => setIsRecipeSearchScopeMenuOpen(false)}
                />
                <TouchableOpacity
                  style={styles.recipeSearchFilterButton}
                  onPress={() => setIsRecipeSearchScopeMenuOpen((prevValue) => !prevValue)}
                >
                  <Ionicons name="options-outline" size={18} color={palette.accent} />
                </TouchableOpacity>
              </View>

              {isRecipeSearchScopeMenuOpen ? (
                <View style={styles.recipeSearchScopeMenu}>
                  {recipeSearchScopeOptions.map((option) => {
                    const isSelectedScope = option.key === recipeSearchScope;
                    return (
                      <TouchableOpacity
                        key={`recipe-search-scope-${option.key}`}
                        style={styles.recipeSearchScopeMenuItem}
                        onPress={() => {
                          setRecipeSearchScope(option.key);
                          setIsRecipeSearchScopeMenuOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.recipeSearchScopeMenuText,
                            isSelectedScope && styles.recipeSearchScopeMenuTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                        {isSelectedScope ? (
                          <Ionicons name="checkmark" size={16} color={palette.accent} />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}
            </View>

            {cookbookFeedback ? <Text style={styles.feedback}>{cookbookFeedback}</Text> : null}

            {hasSearchQuery ? (
              isSearchingRecipes ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator size="small" color={palette.accent} />
                </View>
              ) : recipeSearchResults.length > 0 ? (
                <View style={styles.cookbookRecipesScreenList}>
                  {recipeSearchResults.map((recipe) => {
                    const isRecipeFromAnotherUser =
                      String(recipe.owner_user_id || '') !== String(userId || '');
                    const recipeIsAuthor = isAuthorRecipe(recipe);
                    const recipeDescriptionPreview =
                      splitRecipeDescription(recipe.description || '').descriptionText ||
                      String(recipe.description || '').trim() ||
                      'Sin descripción';

                    return (
                      <TouchableOpacity
                        key={`recipe-search-result-${recipe.id}`}
                        style={styles.cookbookRecipeItem}
                        activeOpacity={0.85}
                        onPress={() => handleOpenRecipeDetail(recipe)}
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

                        <View style={styles.recipeSearchResultContent}>
                          <View style={styles.recipeSearchResultTitleRow}>
                            <Text style={styles.cookbookRecipeName}>{recipe.name}</Text>
                            {recipeIsAuthor ? (
                              <Ionicons
                                name="checkmark-circle"
                                size={16}
                                color="#1D9BF0"
                                style={styles.recipeSearchAuthorBadge}
                              />
                            ) : null}
                          </View>

                          <Text style={styles.cookbookRecipeDescription} numberOfLines={2}>
                            {recipeDescriptionPreview}
                          </Text>

                          {isRecipeFromAnotherUser ? (
                            <Text style={styles.recipeSearchResultMeta}>
                              <Text style={styles.recipeSearchResultMetaPrefix}>Por </Text>
                              <Text style={styles.recipeSearchResultMetaName}>
                                {getRecipeOwnerLabel(recipe)}
                              </Text>
                              {recipeIsAuthor ? (
                                <Text style={styles.recipeSearchResultMetaAuthor}> · de Autor</Text>
                              ) : null}
                            </Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.emptyText}>{recipeSearchFeedback || 'No se encontraron recetas.'}</Text>
              )
            ) : isCookbooksLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color={palette.accent} />
              </View>
            ) : (
              <>
                <View style={styles.cookbooksList}>
                  {cookbooks.map((cookbook) => (
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
                  ))}

                  <TouchableOpacity
                    style={styles.cookbookCard}
                    activeOpacity={0.85}
                    onPress={handleOpenNewCookbookCard}
                  >
                    <View style={[styles.cookbookPreview, styles.newCookbookPreview]}>
                      <Ionicons name="add" size={38} color={palette.accent} />
                    </View>
                    <Text style={styles.cookbookTitle}>Nuevo Recetario</Text>
                  </TouchableOpacity>
                </View>

                {cookbooks.length === 0 ? (
                  <Text style={styles.emptyText}>Aún no hay recetarios creados.</Text>
                ) : null}
              </>
            )}
          </>
        )}
      </View>
    );
  };

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

  const getEdgeFunctionAuthHeaders = async () => {
    if (!supabase) {
      return null;
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      return null;
    }

    let accessToken = sessionData?.session?.access_token || '';
    if (!accessToken) {
      const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        return null;
      }
      accessToken = refreshedData?.session?.access_token || '';
    }

    if (!accessToken) {
      return null;
    }

    return {
      Authorization: `Bearer ${accessToken}`,
    };
  };

  const handleOpenPasteTextImport = () => {
    closeCreateRecipeSheet(() => {
      setPasteRecipeFeedback('');
      setPasteRecipeText('');
      setIsPasteTextModalOpen(true);
    });
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (Platform.OS !== 'web') {
        const clipboardText = await ExpoClipboard.getStringAsync();
        const normalizedText = String(clipboardText || '').trim();
        if (!normalizedText) {
          setPasteRecipeFeedback('El portapapeles está vacío.');
          return;
        }

        setPasteRecipeText(normalizedText);
        setPasteRecipeFeedback('');
        return;
      }

      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        const clipboardText = await navigator.clipboard.readText();
        const normalizedText = String(clipboardText || '').trim();
        if (!normalizedText) {
          setPasteRecipeFeedback('El portapapeles está vacío.');
          return;
        }

        setPasteRecipeText(normalizedText);
        setPasteRecipeFeedback('');
        return;
      }

      Alert.alert('Portapapeles', 'En este dispositivo, pega el texto manualmente en el campo.');
    } catch (_error) {
      setPasteRecipeFeedback('No se pudo leer el portapapeles.');
    }
  };

  const handleImportRecipeFromPastedText = async () => {
    if (!supabase || !isSupabaseConfigured || !userId) {
      setPasteRecipeFeedback('Debes iniciar sesión y configurar Supabase para importar.');
      return;
    }

    const rawText = pasteRecipeText.trim();
    if (!rawText) {
      setPasteRecipeFeedback('Pega o escribe el texto de la receta para importar.');
      return;
    }

    const edgeAuthHeaders = await getEdgeFunctionAuthHeaders();
    if (!edgeAuthHeaders) {
      setPasteRecipeFeedback('Tu sesión no es válida. Cierra sesión y vuelve a entrar.');
      return;
    }

    setIsImportingRecipe(true);
    setPasteRecipeFeedback('Leyendo...');

    let data;
    let error;
    try {
      const response = await supabase.functions.invoke('import-recipe-from-text', {
        body: {
          text: rawText,
        },
        headers: edgeAuthHeaders,
      });
      data = response.data;
      error = response.error;
    } catch (invokeError) {
      setIsImportingRecipe(false);
      setPasteRecipeFeedback(
        invokeError instanceof Error ? invokeError.message : 'Error al procesar el texto.'
      );
      return;
    }

    setIsImportingRecipe(false);

    if (error) {
      let detailedMessage = error.message || 'No se pudo importar la receta desde texto.';
      const contextResponse = error.context;
      if (contextResponse) {
        try {
          const payload = await contextResponse.clone().json();
          if (typeof payload?.error === 'string' && payload.error) {
            detailedMessage = payload.error;
          } else if (typeof payload?.message === 'string' && payload.message) {
            detailedMessage = payload.message;
          }
        } catch (_jsonError) {
          try {
            const rawErrorText = await contextResponse.clone().text();
            if (rawErrorText) {
              detailedMessage = rawErrorText;
            }
          } catch (_textError) {
            // fallback to default message
          }
        }
      }

      setPasteRecipeFeedback(detailedMessage);
      return;
    }

    if (data?.error) {
      setPasteRecipeFeedback(String(data.error));
      return;
    }

    const importedRecipeId = data?.recipe?.id;
    if (!importedRecipeId) {
      setPasteRecipeFeedback('Se procesó el texto, pero no se pudo abrir la receta.');
      return;
    }

    setIsPasteTextModalOpen(false);
    setPasteRecipeText('');
    setPasteRecipeFeedback('');
    await openRecipeInManualEditForm(importedRecipeId, data?.recipe || null);
  };

  const handleImportRecipeFromImage = async (sourceType) => {
    if (!supabase || !isSupabaseConfigured || !userId) {
      Alert.alert('Importar receta', 'Debes iniciar sesión y configurar Supabase para importar.');
      return;
    }

    try {
      let pickerResult = null;

      if (sourceType === 'upload') {
        if (Platform.OS !== 'web') {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (permission.status !== 'granted') {
            Alert.alert('Permiso requerido', 'Debes permitir acceso a tus fotos para subir una imagen.');
            return;
          }
        }

        pickerResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.7,
          base64: true,
        });
      } else {
        if (Platform.OS !== 'web') {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (permission.status !== 'granted') {
            Alert.alert('Permiso requerido', 'Debes permitir acceso a la cámara para tomar una foto.');
            return;
          }
        }

        pickerResult = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.7,
          base64: true,
        });
      }

      if (!pickerResult || pickerResult.canceled || !pickerResult.assets?.length) {
        return;
      }

      const selectedAsset = pickerResult.assets[0];
      const imageBase64 = String(selectedAsset.base64 || '').trim();
      if (!imageBase64) {
        Alert.alert('Importar receta', 'No se pudo procesar la imagen. Intenta con otra foto.');
        return;
      }

      const mimeType = selectedAsset.mimeType || 'image/jpeg';

      const edgeAuthHeaders = await getEdgeFunctionAuthHeaders();
      if (!edgeAuthHeaders) {
        Alert.alert('Importar receta', 'Tu sesión no es válida. Cierra sesión y vuelve a entrar.');
        return;
      }

      setIsImportingRecipe(true);
      setImageImportProgressText('Leyendo Imagen...');

      let data;
      let error;
      try {
        const response = await supabase.functions.invoke('import-recipe-from-image', {
          body: {
            image_base64: imageBase64,
            mime_type: mimeType,
            source_type: sourceType,
          },
          headers: edgeAuthHeaders,
        });
        data = response.data;
        error = response.error;
      } catch (invokeError) {
        setIsImportingRecipe(false);
        setImageImportProgressText('');
        Alert.alert(
          'Importar receta',
          invokeError instanceof Error ? invokeError.message : 'Error al analizar la imagen.'
        );
        return;
      }

      if (error) {
        setIsImportingRecipe(false);
        setImageImportProgressText('');
        let detailedMessage = error.message || 'No se pudo importar la receta desde imagen.';
        const contextResponse = error.context;
        if (contextResponse) {
          try {
            const payload = await contextResponse.clone().json();
            if (typeof payload?.error === 'string' && payload.error) {
              detailedMessage = payload.error;
            } else if (typeof payload?.message === 'string' && payload.message) {
              detailedMessage = payload.message;
            }
          } catch (_jsonError) {
            try {
              const rawText = await contextResponse.clone().text();
              if (rawText) {
                detailedMessage = rawText;
              }
            } catch (_textError) {
              // fallback to default message
            }
          }
        }

        Alert.alert('No se detectó una receta', detailedMessage);
        return;
      }

      if (data?.error) {
        setIsImportingRecipe(false);
        setImageImportProgressText('');
        Alert.alert('No se detectó una receta', String(data.error));
        return;
      }

      const importedRecipeId = data?.recipe?.id;
      if (!importedRecipeId) {
        setIsImportingRecipe(false);
        setImageImportProgressText('');
        Alert.alert('Importar receta', 'La receta se analizó, pero no se pudo abrir.');
        return;
      }

      setImageImportProgressText('Leyendo Imagen...');
      await openRecipeInManualEditForm(importedRecipeId, data?.recipe || null);
      setIsImportingRecipe(false);
      setImageImportProgressText('');
    } catch (unexpectedError) {
      setIsImportingRecipe(false);
      setImageImportProgressText('');
      Alert.alert(
        'Importar receta',
        unexpectedError instanceof Error
          ? unexpectedError.message
          : 'Ocurrió un error inesperado al procesar la imagen.'
      );
    }
  };

  const handleOpenCameraImport = () => {
    closeCreateRecipeSheet(() => {
      setIsCameraImportPickerOpen(true);
    });
  };

  const resetManualRecipeForm = () => {
    setManualRecipeEditingId(null);
    setManualRecipeTitle('');
    setManualMainPhotoUrl('');
    setManualRecipeDescription('');
    setManualIngredients(['']);
    setManualSteps(['']);
    setManualIsPublic(false);
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

  const handleOpenManualRecipeEditForm = () => {
    if (!selectedRecipeForView || !canEditSelectedRecipe) {
      return;
    }

    setRecipeDetailDraft(buildRecipeDetailDraft(selectedRecipeForView));
    setIsRecipeStepReorderMode(false);
    setDraggingRecipeStepIndex(null);
    setRecipeDetailMode('edit');
    setRecipeDetailFeedback('');
  };

  const handleCancelRecipeDetailEdit = () => {
    if (!selectedRecipeForView) {
      return;
    }

    setRecipeDetailDraft(buildRecipeDetailDraft(selectedRecipeForView));
    setIsRecipeStepReorderMode(false);
    setDraggingRecipeStepIndex(null);
    setRecipeDetailMode('view');
    setRecipeDetailFeedback('');
    setIsSavingRecipeDetail(false);
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
    recipeDetailRequestIdRef.current += 1;
    closePlanAssignModal();
    setSelectedCookbookForView(null);
    setSelectedRecipeForView(null);
    setIsRecipeStepReorderMode(false);
    setDraggingRecipeStepIndex(null);
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
    const refreshedCookbooks = await loadCookbooks({ force: true });
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
    recipeDetailRequestIdRef.current += 1;
    setSelectedCookbookForView(cookbook);
    setSelectedRecipeForView(null);
    setIsRecipeStepReorderMode(false);
    setDraggingRecipeStepIndex(null);
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
    recipeDetailRequestIdRef.current += 1;
    closePlanAssignModal();
    setSelectedRecipeForView(null);
    setIsRecipeStepReorderMode(false);
    setDraggingRecipeStepIndex(null);
    setRecipeDetailMode('view');
    setRecipeDetailFeedback('');
    setIsSavingRecipeDetail(false);
    setIsRecipeMoreDropdownOpen(false);
    setIsDeletingRecipe(false);
    setIsRecipeMoreMenuOpen(false);
    setIsRecipeDeleteConfirmOpen(false);
    setIsRecipeCookbookPickerOpen(false);
    setRecipeCookbookSelectionIds([]);
    setIsSavingRecipeCookbookSelection(false);
    setIsRecipeListPickerOpen(false);
    setRecipeListIngredients([]);
    setSelectedRecipeListIngredientKeys([]);
    setIsAddingRecipeIngredientsToList(false);
  };

  const handleOpenRecipeDetail = async (recipe) => {
    if (!recipe) {
      return;
    }

    recipeDetailRequestIdRef.current += 1;
    const requestId = recipeDetailRequestIdRef.current;
    setSelectedRecipeForView(recipe);
    setIsRecipeStepReorderMode(false);
    setDraggingRecipeStepIndex(null);
    setRecipeDetailMode('view');
    setRecipeDetailFeedback('');
    setRecipeDetailDraft(buildRecipeDetailDraft(recipe));

    const detailedRecipe = await ensureRecipeDetailsLoaded(recipe);
    if (!detailedRecipe) {
      return;
    }

    if (requestId !== recipeDetailRequestIdRef.current) {
      return;
    }

    setSelectedRecipeForView(detailedRecipe);
    setRecipeDetailDraft(buildRecipeDetailDraft(detailedRecipe));
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

  const updateRecipeDraftStepPhoto = (targetIndex, value) => {
    setRecipeDetailDraft((prevDraft) => {
      const currentStepPhotos = Array.isArray(prevDraft.stepPhotos)
        ? [...prevDraft.stepPhotos]
        : Array.from({ length: prevDraft.steps.length }, () => '');
      while (currentStepPhotos.length < prevDraft.steps.length) {
        currentStepPhotos.push('');
      }
      currentStepPhotos[targetIndex] = String(value || '');
      return {
        ...prevDraft,
        stepPhotos: currentStepPhotos,
      };
    });
  };

  const addRecipeDraftStep = () => {
    setRecipeDetailDraft((prevDraft) => ({
      ...prevDraft,
      steps: [...prevDraft.steps, ''],
      stepPhotos: [...(Array.isArray(prevDraft.stepPhotos) ? prevDraft.stepPhotos : []), ''],
    }));
  };

  const removeRecipeDraftStep = (targetIndex) => {
    setRecipeDetailDraft((prevDraft) => {
      const nextSteps = prevDraft.steps.filter((_, index) => index !== targetIndex);
      const nextStepPhotos = (Array.isArray(prevDraft.stepPhotos) ? prevDraft.stepPhotos : []).filter(
        (_, index) => index !== targetIndex
      );
      return {
        ...prevDraft,
        steps: nextSteps.length > 0 ? nextSteps : [''],
        stepPhotos: nextStepPhotos.length > 0 ? nextStepPhotos : [''],
      };
    });
  };

  const moveRecipeDraftStep = (fromIndex, toIndex) => {
    setRecipeDetailDraft((prevDraft) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= prevDraft.steps.length ||
        toIndex >= prevDraft.steps.length
      ) {
        return prevDraft;
      }

      const nextSteps = [...prevDraft.steps];
      const [movedStep] = nextSteps.splice(fromIndex, 1);
      nextSteps.splice(toIndex, 0, movedStep);

      const baseStepPhotos = Array.isArray(prevDraft.stepPhotos)
        ? [...prevDraft.stepPhotos]
        : Array.from({ length: prevDraft.steps.length }, () => '');
      while (baseStepPhotos.length < prevDraft.steps.length) {
        baseStepPhotos.push('');
      }
      const [movedPhoto] = baseStepPhotos.splice(fromIndex, 1);
      baseStepPhotos.splice(toIndex, 0, movedPhoto);

      return {
        ...prevDraft,
        steps: nextSteps,
        stepPhotos: baseStepPhotos,
      };
    });
  };

  const handlePickRecipeDetailStepPhoto = async (targetIndex) => {
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

    updateRecipeDraftStepPhoto(targetIndex, photoUrl);
    setRecipeDetailFeedback('');
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

    const cleanStepRows = recipeDetailDraft.steps
      .map((item, index) => ({
        step: item.trim(),
        photo: String(recipeDetailDraft.stepPhotos?.[index] || '').trim(),
      }))
      .filter((row) => row.step.length > 0);
    const cleanSteps = cleanStepRows.map((row) => row.step);
    const cleanStepPhotos = cleanStepRows.map((row) => row.photo);
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
        additional_photos: cleanStepPhotos,
        steps: cleanSteps,
        instructions: cleanSteps.join('\n'),
        is_public: recipeDetailDraft.isPublic,
      })
      .eq('id', selectedRecipeForView.id)
      .eq('owner_user_id', userId);
    setIsSavingRecipeDetail(false);

    if (error) {
      setRecipeDetailFeedback('No se pudo actualizar la receta.');
      return;
    }

    const syncedRecipe = {
      ...selectedRecipeForView,
      name,
      description: descriptionToSave,
      main_photo_url: recipeDetailDraft.mainPhotoUrl || null,
      additional_photos: cleanStepPhotos,
      steps: cleanSteps,
      instructions: cleanSteps.join('\n'),
      is_public: recipeDetailDraft.isPublic,
    };

    const updatedCookbook = await refreshCookbooksAndSelectedCookbook(selectedCookbookForView?.id);
    if (updatedCookbook) {
      const refreshedRecipe = (updatedCookbook.recipes || []).find(
        (recipe) => String(recipe.id) === String(selectedRecipeForView.id)
      );

      if (refreshedRecipe) {
        const mergedRecipe = {
          ...refreshedRecipe,
          ...syncedRecipe,
        };
        recipeDetailsCacheRef.current[String(mergedRecipe.id)] = mergedRecipe;
        setSelectedRecipeForView(mergedRecipe);
        setRecipeDetailDraft(buildRecipeDetailDraft(mergedRecipe));
      }
    } else {
      recipeDetailsCacheRef.current[String(syncedRecipe.id)] = syncedRecipe;
      setSelectedRecipeForView(syncedRecipe);
      setRecipeDetailDraft(buildRecipeDetailDraft(syncedRecipe));
    }

    setRecipeDetailMode('view');
    setIsRecipeStepReorderMode(false);
    setDraggingRecipeStepIndex(null);
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

  const handlePickRecipeDetailPhotoFromSource = async (sourceType = 'gallery') => {
    if (!canEditSelectedRecipe || recipeDetailMode !== 'edit') {
      return;
    }

    if (sourceType === 'camera' && Platform.OS === 'web') {
      setRecipeDetailFeedback('La cámara no está disponible en web.');
      return;
    }

    if (sourceType === 'camera' && Platform.OS !== 'web') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== 'granted') {
        setRecipeDetailFeedback('Debes permitir acceso a la cámara para tomar foto.');
        return;
      }
    }

    if (sourceType !== 'camera' && Platform.OS !== 'web') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        setRecipeDetailFeedback('Debes permitir acceso a tus fotos para agregar imagen.');
        return;
      }
    }

    const result =
      sourceType === 'camera'
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.65,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
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

  const handlePickRecipeDetailPhoto = async () => {
    await handlePickRecipeDetailPhotoFromSource('gallery');
  };

  const getTodayDateString = () => toIsoDate(new Date());
  const getTomorrowDateString = () => addDaysToIsoDate(getTodayDateString(), 1);

  const closePlanAssignModal = () => {
    if (isSavingPlanAssignment) {
      return;
    }

    setIsPlanAssignModalOpen(false);
    setPlanAssignmentRecipe(null);
    setPlanAssignDate('');
    setPlanAssignDateMode('tomorrow');
    setPlanAssignMealType('almuerzo');
    setPlanAssignFeedback('');
    setPlanRecipeSearchQuery('');
    setSelectedPlanRecipeId('');
  };

  const openPlanAssignModalForRecipe = async (recipe, dateOverride, mealTypeOverride = 'almuerzo') => {
    if (!recipe?.id && !dateOverride) {
      return;
    }

    const todayIso = getTodayDateString();
    const tomorrowIso = getTomorrowDateString();
    const incomingDate = dateOverride || tomorrowIso;
    const selectedDate = incomingDate <= todayIso ? tomorrowIso : incomingDate;
    const selectedDateMode =
      selectedDate === todayIso
        ? 'today'
        : selectedDate === tomorrowIso
        ? 'tomorrow'
        : 'custom';
    setPlanAssignDate(selectedDate);
    setPlanAssignDateMode(selectedDateMode);
    setPlanAssignMealType(mealTypeOverride);
    setPlanAssignFeedback('');
    setPlanRecipeSearchQuery('');
    setSelectedPlanRecipeId('');
    const recipes = await loadPlanRecipeOptions();

    if (recipe?.id) {
      setPlanAssignmentRecipe({
        id: recipe.id,
        name: recipe.name || 'Receta',
      });
      setSelectedPlanRecipeId(String(recipe.id || recipes?.[0]?.id || ''));
    } else {
      setPlanAssignmentRecipe(null);
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

  const handleSelectPlanAssignDateMode = (mode) => {
    const todayIso = getTodayDateString();
    const tomorrowIso = getTomorrowDateString();

    setPlanAssignDateMode(mode);
    if (mode === 'today') {
      setPlanAssignDate(todayIso);
      setPlanAssignFeedback('La fecha debe ser futura. Hoy no es válido.');
      return;
    }

    if (mode === 'tomorrow') {
      setPlanAssignDate(tomorrowIso);
      setPlanAssignFeedback('');
      return;
    }

    if (!planAssignDate.trim()) {
      setPlanAssignDate(tomorrowIso);
    }
    setPlanAssignFeedback('');
  };

  const planAssignCustomDateOptions = useMemo(() => {
    const todayIso = getTodayDateString();
    return Array.from({ length: 45 }, (_, index) => addDaysToIsoDate(todayIso, index + 1));
  }, [planWeekStartIso]);

  const formatPlanAssignDateChipLabel = (isoDate) => {
    const dateObject = parseIsoDate(isoDate);
    if (!dateObject) {
      return isoDate;
    }
    try {
      const weekday = new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(dateObject);
      const dayMonth = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit' }).format(
        dateObject
      );
      const normalizedWeekday = `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}`.replace('.', '');
      return `${normalizedWeekday} ${dayMonth}`;
    } catch (_error) {
      return isoDate;
    }
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
          is_public: false,
        });
      }
      return;
    }

    setPlanFeedback('');
    const { data, error } = await supabase
      .from('recipes')
      .select(
        'id, owner_user_id, name, description, main_photo_url, additional_photos, steps, instructions, is_public, source_url'
      )
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

    const refreshedCookbooks = await loadCookbooks({ force: true });
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
      const mergedRecipe = {
        ...refreshedRecipe,
        ...selectedRecipeForView,
      };
      recipeDetailsCacheRef.current[String(mergedRecipe.id)] = mergedRecipe;
      setSelectedRecipeForView(mergedRecipe);
      setRecipeDetailDraft(buildRecipeDetailDraft(mergedRecipe));
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

    const selectedRecipeId = selectedPlanRecipeId ? Number(selectedPlanRecipeId) : null;

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

    if (normalizedDate <= getTodayDateString()) {
      setPlanAssignFeedback('La fecha debe ser futura. Selecciona mañana o una fecha posterior.');
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
      planRecipeOptions.find((recipe) => String(recipe.id) === String(selectedRecipeId))?.name ||
      planAssignmentRecipe?.name ||
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
          is_public: manualIsPublic,
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
          is_public: manualIsPublic,
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

    const refreshedCookbooks = await loadCookbooks({ force: true });
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
          const syncedRecipe = {
            ...refreshedRecipe,
            name,
            description: recipeDescription || '',
            main_photo_url: manualMainPhotoUrl || refreshedRecipe.main_photo_url || null,
            steps: cleanSteps,
            instructions: cleanSteps.join('\n'),
            is_public: manualIsPublic,
          };
          recipeDetailsCacheRef.current[String(syncedRecipe.id)] = syncedRecipe;
          setSelectedRecipeForView(syncedRecipe);
          setRecipeDetailDraft(buildRecipeDetailDraft(syncedRecipe));
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
      .select(
        'id, owner_user_id, name, description, main_photo_url, additional_photos, steps, instructions, is_public, source_url'
      )
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
        additional_photos: importedRecipeFallback.additional_photos || [],
        steps: importedRecipeFallback.steps || [],
        instructions: importedRecipeFallback.instructions || '',
        source_url: importedRecipeFallback.source_url || '',
        is_public: Boolean(importedRecipeFallback.is_public),
      };
    }

    if (recipeError && !recipeData) {
      setImportFeedback('Se importó, pero no se pudo abrir en modo edición.');
      return;
    }

    const refreshedCookbooks = await loadCookbooks({ force: true });
    const sourceCookbooks = Array.isArray(refreshedCookbooks) ? refreshedCookbooks : ownCookbooks;
    const recipeFromCookbooks = findRecipeAcrossCookbooks(sourceCookbooks, recipeData.id);
    const syncedRecipe = recipeFromCookbooks
      ? {
          ...recipeData,
          ...recipeFromCookbooks,
        }
      : recipeData;
    const parentCookbook = sourceCookbooks.find((cookbook) =>
      (cookbook.recipes || []).some((recipe) => String(recipe.id) === String(syncedRecipe.id))
    );

    recipeDetailsCacheRef.current[String(syncedRecipe.id)] = syncedRecipe;

    setIsImportUrlModalOpen(false);
    setImportUrl('');
    setImportFeedback('');
    setIsManualRecipeModalOpen(false);
    setSelectedCookbookForView(parentCookbook || null);
    setSelectedRecipeForView(syncedRecipe);
    setRecipeDetailDraft(buildRecipeDetailDraft(syncedRecipe));
    setRecipeDetailMode('edit');
    setRecipeDetailFeedback('Receta importada. Ajusta lo necesario y guarda cambios.');
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

    const edgeAuthHeaders = await getEdgeFunctionAuthHeaders();
    if (!edgeAuthHeaders) {
      setImportFeedback('Tu sesión no es válida. Cierra sesión y vuelve a entrar.');
      return;
    }

    setIsImportingRecipe(true);
    setImportFeedback('Importando receta...');

    let data;
    let error;
    try {
      const response = await supabase.functions.invoke('import-recipe-from-url', {
        body: {
          url: parsedUrl.toString(),
        },
        headers: edgeAuthHeaders,
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

    const normalizedImportUrl = parsedUrl.toString();
    await supabase
      .from('recipes')
      .update({
        source_url: normalizedImportUrl,
      })
      .eq('id', importedRecipeId)
      .eq('owner_user_id', userId);

    const importedRecipeFallback =
      data?.recipe && typeof data.recipe === 'object'
        ? {
            ...data.recipe,
            source_url: normalizedImportUrl,
          }
        : null;

    await openRecipeInManualEditForm(importedRecipeId, importedRecipeFallback);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.mainLogoWrap}>
        <Image source={require('../public/logo.png')} style={styles.mainLogo} resizeMode="contain" />
      </View>

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
              {displayedTab === 'recetas' && (
                <RecetasTabScreen
                  renderRecetasView={renderRecetasView}
                />
              )}

              {displayedTab === 'lista' && (
                <ListaTabScreen
                  styles={styles}
                  palette={palette}
                  isSupabaseConfigured={isSupabaseConfigured}
                  shoppingInput={shoppingInput}
                  setShoppingInput={setShoppingInput}
                  isMutatingList={isMutatingList}
                  handleAddItem={handleAddItem}
                  canClearCompleted={canClearCompleted}
                  canClearAll={canClearAll}
                  handleClearCompleted={handleClearCompleted}
                  handleClearAll={handleClearAll}
                  listFeedback={listFeedback}
                  isListLoading={isListLoading}
                  shoppingItems={shoppingItems}
                  decodeShoppingItemName={decodeShoppingItemName}
                  handleToggleItem={handleToggleItem}
                />
              )}

              {displayedTab === 'plan' && (
                <PlanTabScreen
                  styles={styles}
                  palette={palette}
                  formattedPlanWeekRange={formattedPlanWeekRange}
                  shiftPlanWeek={shiftPlanWeek}
                  isPlanLoading={isPlanLoading}
                  isMutatingPlan={isMutatingPlan}
                  planFeedback={planFeedback}
                  planWeekDays={planWeekDays}
                  handleOpenPlanAssignForDay={handleOpenPlanAssignForDay}
                  handleOpenPlanRecipeDetail={handleOpenPlanRecipeDetail}
                  handleOpenPlanAssignForDayMeal={handleOpenPlanAssignForDayMeal}
                  handleRemoveRecipeFromPlanSlot={handleRemoveRecipeFromPlanSlot}
                />
              )}

              {displayedTab === 'perfil' && (
                <PerfilTabScreen
                  styles={styles}
                  profileDisplayName={profileDisplayName}
                  profileAvatarUrl={userAvatar}
                  userEmail={userEmail}
                  onLogout={onLogout}
                />
              )}
            </>
          )}
        </ScrollView>
      </Animated.View>

      <View style={styles.bottomBar}>
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.key;

          return (
            <React.Fragment key={tab.key}>
              {index === 2 ? <View style={styles.bottomFabGap} /> : null}
              <TouchableOpacity
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => {
                  if (selectedRecipeForView) {
                    closeRecipeDetailView();
                  }
                  setActiveTab(tab.key);
                }}
              >
                <Ionicons
                  name={tab.icon}
                  size={20}
                  color={isActive ? palette.accent : '#D9F4EE'}
                />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.fabButton}
        onPress={openCreateRecipeSheet}
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={32} color={palette.card} />
      </TouchableOpacity>

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
            <TouchableOpacity style={styles.sheetOption} onPress={handleOpenCameraImport}>
              <View style={styles.sheetOptionContent}>
                <Ionicons name="camera-outline" size={20} color={palette.accent} />
                <Text style={styles.sheetOptionText}>Camara</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetOption} onPress={handleOpenPasteTextImport}>
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
        visible={isCreateCookbookSheetOpen}
        animationType="slide"
        transparent
        onRequestClose={closeCreateCookbookSheet}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdrop} onPress={closeCreateCookbookSheet} />
          <View style={styles.cookbookCreateSheet}>
            <Text style={styles.sheetTitle}>Nuevo Recetario</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre del recetario"
              placeholderTextColor={palette.mutedText}
              value={newCookbookName}
              onChangeText={setNewCookbookName}
              editable={!isMutatingCookbooks}
              autoFocus
              onSubmitEditing={() => handleAddCookbook(newCookbookName)}
              returnKeyType="done"
            />

            {cookbookFeedback ? <Text style={styles.feedback}>{cookbookFeedback}</Text> : null}

            <TouchableOpacity
              style={[
                styles.cookbookCreateSaveButton,
                (isMutatingCookbooks || !newCookbookName.trim()) && styles.buttonDisabled,
              ]}
              onPress={() => handleAddCookbook(newCookbookName)}
              disabled={isMutatingCookbooks || !newCookbookName.trim()}
            >
              <Text style={styles.cookbookCreateSaveButtonText}>
                {isMutatingCookbooks ? 'Guardando...' : 'Guardar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isCameraImportPickerOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsCameraImportPickerOpen(false)}
      >
        <View style={styles.cameraImportOverlay}>
          <Pressable
            style={styles.cameraImportBackdrop}
            onPress={() => setIsCameraImportPickerOpen(false)}
          />
          <View style={styles.cameraImportPopup}>
            <Text style={styles.cameraImportTitle}>Importar receta con imagen</Text>
            <Text style={styles.cameraImportSubtitle}>Elige cómo quieres agregar la receta.</Text>

            <TouchableOpacity
              style={styles.cameraImportOption}
              onPress={() => {
                setIsCameraImportPickerOpen(false);
                void handleImportRecipeFromImage('upload');
              }}
            >
              <Ionicons name="images-outline" size={20} color={palette.accent} />
              <Text style={styles.cameraImportOptionText}>Seleccionar Imagen</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cameraImportOption}
              onPress={() => {
                setIsCameraImportPickerOpen(false);
                void handleImportRecipeFromImage('camera');
              }}
            >
              <Ionicons name="camera-outline" size={20} color={palette.accent} />
              <Text style={styles.cameraImportOptionText}>Tomar Fotografía</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cameraImportCancel}
              onPress={() => setIsCameraImportPickerOpen(false)}
            >
              <Text style={styles.cameraImportCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isPasteTextModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsPasteTextModalOpen(false)}
      >
        <View style={styles.importOverlay}>
          <Pressable style={styles.importBackdrop} onPress={() => setIsPasteTextModalOpen(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.importPopupWrap}
          >
            <View style={styles.importPopup}>
              <Text style={styles.importTitle}>Importar desde texto</Text>
              <Text style={styles.importSubtitle}>
                Pega una receta completa y el sistema extraerá título, descripción, ingredientes y pasos.
              </Text>

              <View style={styles.pasteHeaderRow}>
                <TouchableOpacity
                  style={[styles.importButtonSecondary, isImportingRecipe && styles.buttonDisabled]}
                  onPress={handlePasteFromClipboard}
                  disabled={isImportingRecipe}
                >
                  <Text style={styles.importButtonSecondaryText}>Pegar</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.importInput, styles.pasteTextInput]}
                value={pasteRecipeText}
                onChangeText={setPasteRecipeText}
                placeholder="Pega aquí el texto de la receta..."
                placeholderTextColor={palette.mutedText}
                editable={!isImportingRecipe}
                multiline
                textAlignVertical="top"
                autoCapitalize="none"
                autoCorrect={false}
              />

              {pasteRecipeFeedback ? (
                <Text
                  style={[
                    styles.importFeedback,
                    pasteRecipeFeedback.toLowerCase().includes('importada') && styles.importFeedbackSuccess,
                    pasteRecipeFeedback.toLowerCase().includes('leyendo') && styles.importFeedbackInfo,
                  ]}
                >
                  {pasteRecipeFeedback}
                </Text>
              ) : null}

              <View style={styles.importActions}>
                <TouchableOpacity
                  style={[styles.importButtonSecondary, isImportingRecipe && styles.buttonDisabled]}
                  onPress={() => setIsPasteTextModalOpen(false)}
                  disabled={isImportingRecipe}
                >
                  <Text style={styles.importButtonSecondaryText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.importButtonPrimary,
                    (isImportingRecipe || !pasteRecipeText.trim()) && styles.buttonDisabled,
                  ]}
                  onPress={handleImportRecipeFromPastedText}
                  disabled={isImportingRecipe || !pasteRecipeText.trim()}
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
        visible={Boolean(imageImportProgressText)}
        animationType="fade"
        transparent
      >
        <View style={styles.cameraImportOverlay}>
          <View style={styles.imageImportLoadingCard}>
            <ActivityIndicator size="small" color={palette.accent} />
            <Text style={styles.imageImportLoadingText}>{imageImportProgressText}</Text>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isRecipeMoreMenuOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsRecipeMoreMenuOpen(false)}
      >
        <View style={styles.cameraImportOverlay}>
          <Pressable
            style={styles.cameraImportBackdrop}
            onPress={() => setIsRecipeMoreMenuOpen(false)}
          />
          <View style={styles.recipeMoreMenuPopup}>
            <TouchableOpacity
              style={styles.recipeMoreMenuItem}
              onPress={() => {
                setIsRecipeMoreMenuOpen(false);
                void handleExportRecipePdf();
              }}
              disabled={isDeletingRecipe}
            >
              <Ionicons name="document-outline" size={20} color={palette.accent} />
              <Text style={styles.recipeMoreMenuItemText}>Exportar PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.recipeMoreMenuItem}
              onPress={() => {
                setIsRecipeMoreMenuOpen(false);
                setIsRecipeDeleteConfirmOpen(true);
              }}
              disabled={isDeletingRecipe}
            >
              <Ionicons name="trash-outline" size={20} color="#DC2626" />
              <Text style={styles.recipeMoreMenuItemTextDanger}>Borrar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.recipeMoreMenuCancel}
              onPress={() => setIsRecipeMoreMenuOpen(false)}
            >
              <Text style={styles.recipeMoreMenuCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isRecipeDeleteConfirmOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsRecipeDeleteConfirmOpen(false)}
      >
        <View style={styles.cameraImportOverlay}>
          <Pressable
            style={styles.cameraImportBackdrop}
            onPress={() => setIsRecipeDeleteConfirmOpen(false)}
          />
          <View style={styles.recipeMoreMenuPopup}>
            <Text style={styles.recipeDeleteConfirmTitle}>Borrar receta</Text>
            <Text style={styles.recipeDeleteConfirmText}>
              ¿Deseas borrar esta receta? Esta acción no se puede deshacer.
            </Text>
            <View style={styles.recipeDeleteConfirmActions}>
              <TouchableOpacity
                style={styles.importButtonSecondary}
                onPress={() => setIsRecipeDeleteConfirmOpen(false)}
                disabled={isDeletingRecipe}
              >
                <Text style={styles.importButtonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.importButtonPrimary, styles.recipeDeleteConfirmButton, isDeletingRecipe && styles.buttonDisabled]}
                onPress={() => {
                  setIsRecipeDeleteConfirmOpen(false);
                  void handleDeleteSelectedRecipe();
                }}
                disabled={isDeletingRecipe}
              >
                <Text style={styles.importButtonPrimaryText}>
                  {isDeletingRecipe ? 'Borrando...' : 'Borrar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
              <TouchableOpacity
                style={styles.manualShareAction}
                onPress={() => {
                  void handleShareRecipeLink(
                    manualRecipeTitle || 'Receta',
                    setManualRecipeFeedback
                  );
                }}
              >
                <Text style={styles.manualShareText}>Compartir</Text>
                <Ionicons name="share-outline" size={18} color={palette.card} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.manualHeroCenter} onPress={handlePickManualPhoto} activeOpacity={0.9}>
              {manualMainPhotoUrl ? (
                <Image
                  source={{ uri: manualMainPhotoUrl }}
                  style={styles.manualHeroPhoto}
                  resizeMode="cover"
                />
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
                onPress={() => {
                  void handleShareRecipeLink(
                    manualRecipeTitle || 'Receta',
                    setManualRecipeFeedback
                  );
                }}
              >
                <View style={styles.manualQuickActionIcon}>
                  <Ionicons name="share-social-outline" size={20} color={palette.accent} />
                </View>
                <Text style={styles.manualQuickActionText}>Compartir</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.manualVisibilityToggle}
              onPress={() => setManualIsPublic((previousValue) => !previousValue)}
              disabled={isSavingManualRecipe}
            >
              <View style={styles.manualVisibilityToggleLeft}>
                <Ionicons
                  name={manualIsPublic ? 'globe-outline' : 'lock-closed-outline'}
                  size={18}
                  color={palette.accent}
                />
                <Text style={styles.manualVisibilityToggleLabel}>
                  {manualIsPublic ? 'Receta pública' : 'Receta privada'}
                </Text>
              </View>
              <Text style={styles.manualVisibilityToggleAction}>
                {manualIsPublic ? 'Cambiar a privada' : 'Cambiar a pública'}
              </Text>
            </TouchableOpacity>

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

            {isPlanRecipeOptionsLoading ? (
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
                <View style={styles.planRecipeSearchWrap}>
                  <Ionicons name="search-outline" size={16} color={palette.mutedText} />
                  <TextInput
                    style={styles.planRecipeSearchInput}
                    value={planRecipeSearchQuery}
                    onChangeText={setPlanRecipeSearchQuery}
                    placeholder="Buscar receta..."
                    placeholderTextColor={palette.mutedText}
                    editable={!isSavingPlanAssignment}
                  />
                </View>
                <ScrollView style={styles.planRecipeOptionsList}>
                  {filteredPlanRecipeOptions.map((recipe) => {
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
                  {filteredPlanRecipeOptions.length === 0 ? (
                    <Text style={styles.cookbookPickerEmptyText}>
                      No hay recetas que coincidan con la búsqueda.
                    </Text>
                  ) : null}
                </ScrollView>
              </View>
            )}

            <Text style={styles.planAssignDateQuestion}>¿Para cuándo es?</Text>
            <View style={styles.planAssignDateModeRow}>
              {[
                { key: 'today', label: 'Hoy' },
                { key: 'tomorrow', label: 'Mañana' },
                { key: 'custom', label: 'Seleccionar cuándo' },
              ].map((option) => {
                const isSelected = planAssignDateMode === option.key;
                const isDisabled = option.key === 'today';
                return (
                  <TouchableOpacity
                    key={`plan-date-mode-${option.key}`}
                    style={[
                      styles.planAssignDateModeButton,
                      isSelected && styles.planAssignDateModeButtonSelected,
                      (isSavingPlanAssignment || isDisabled) && styles.buttonDisabled,
                    ]}
                    onPress={() => handleSelectPlanAssignDateMode(option.key)}
                    disabled={isSavingPlanAssignment || isDisabled}
                  >
                    <Text
                      style={[
                        styles.planAssignDateModeButtonText,
                        isSelected && styles.planAssignDateModeButtonTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.planAssignDateSelectedText}>Fecha: {planAssignDate || '-'}</Text>

            {planAssignDateMode === 'custom' ? (
              <View style={styles.planAssignDatePickerWrap}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.planAssignDatePickerList}
                >
                  {planAssignCustomDateOptions.map((isoDate) => {
                    const isSelected = planAssignDate === isoDate;
                    return (
                      <TouchableOpacity
                        key={`plan-custom-date-${isoDate}`}
                        style={[
                          styles.planAssignDateChip,
                          isSelected && styles.planAssignDateChipSelected,
                          isSavingPlanAssignment && styles.buttonDisabled,
                        ]}
                        onPress={() => {
                          setPlanAssignDate(isoDate);
                          setPlanAssignFeedback('');
                        }}
                        disabled={isSavingPlanAssignment}
                      >
                        <Text
                          style={[
                            styles.planAssignDateChipText,
                            isSelected && styles.planAssignDateChipTextSelected,
                          ]}
                        >
                          {formatPlanAssignDateChipLabel(isoDate)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

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
  mainLogoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
  },
  mainLogo: {
    width: 224,
    height: 72,
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
  recipesSearchWrap: {
    position: 'relative',
    marginBottom: spacing.md,
    zIndex: 40,
  },
  recipeSearchInputWrap: {
    position: 'relative',
  },
  recipesSearchInput: {
    borderWidth: 1,
    borderColor: '#C6D4E8',
    borderRadius: 12,
    backgroundColor: '#FAFCFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingRight: 46,
    fontFamily: fonts.regular,
    color: palette.accent,
  },
  recipeSearchFilterButton: {
    position: 'absolute',
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeSearchScopeMenu: {
    position: 'absolute',
    right: 0,
    top: 52,
    borderWidth: 1,
    borderColor: '#DCE6EC',
    borderRadius: 12,
    backgroundColor: '#FAFCFF',
    overflow: 'hidden',
    minWidth: 170,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  recipeSearchScopeMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  recipeSearchScopeMenuText: {
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  recipeSearchScopeMenuTextActive: {
    color: palette.accent,
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
  newCookbookPreview: {
    backgroundColor: '#DAD2C4',
    alignItems: 'center',
    justifyContent: 'center',
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
  profilePhotoButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignSelf: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: '#C6D4E8',
    overflow: 'hidden',
    backgroundColor: '#EDF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePhotoImage: {
    width: '100%',
    height: '100%',
  },
  profilePhotoPlaceholder: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDF5FF',
  },
  profilePhotoEditBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#7B8FBC',
    borderWidth: 1,
    borderColor: palette.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileNameText: {
    color: palette.accent,
    fontFamily: fonts.semiBold,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 6,
  },
  profileNameInput: {
    borderWidth: 1,
    borderColor: '#C6D4E8',
    borderRadius: 10,
    backgroundColor: '#FAFCFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 16,
    marginBottom: 8,
  },
  profileEmailText: {
    color: palette.mutedText,
    fontFamily: fonts.regular,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  profileEditActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  profileEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#7B8FBC',
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: spacing.md,
  },
  profileDivider: {
    height: 1,
    backgroundColor: '#DCE6EC',
    marginBottom: spacing.md,
  },
  profilePlusButton: {
    borderWidth: 1,
    borderColor: '#C6D4E8',
    borderRadius: 12,
    backgroundColor: '#EEF5FF',
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  profilePlusButtonText: {
    color: palette.accent,
    fontFamily: fonts.semiBold,
    fontSize: 15,
  },
  profileMenuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 42,
    marginBottom: 6,
  },
  profileMenuText: {
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 15,
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
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    overflow: 'visible',
  },
  bottomFabGap: {
    width: 74,
  },
  fabButton: {
    position: 'absolute',
    left: '50%',
    marginLeft: -36,
    bottom: 52,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: palette.button,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: palette.background,
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
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
  cookbookCreateSheet: {
    backgroundColor: palette.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    borderWidth: 1,
    borderColor: '#DCE6EC',
    gap: spacing.md,
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
  pasteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: spacing.sm,
  },
  pasteTextInput: {
    minHeight: 220,
    maxHeight: 300,
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
  cookbookCreateSaveButton: {
    backgroundColor: palette.button,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cookbookCreateSaveButtonText: {
    color: palette.card,
    fontFamily: fonts.medium,
    fontSize: 14,
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
    zIndex: 25,
  },
  recipeDetailEditActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recipeDetailEditMenuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 20,
  },
  recipeDetailEditButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#C6D4E8',
    backgroundColor: '#FAFCFF',
  },
  recipeDetailEditButtonPrimary: {
    borderColor: palette.button,
    backgroundColor: palette.button,
  },
  recipeDetailEditButtonText: {
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  recipeDetailEditButtonTextPrimary: {
    color: palette.card,
  },
  recipeDetailMoreButton: {
    width: 34,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#C6D4E8',
    backgroundColor: '#FAFCFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeDetailMoreMenuWrap: {
    position: 'relative',
  },
  recipeDetailMoreMenuDropdown: {
    position: 'absolute',
    top: 36,
    right: 0,
    minWidth: 128,
    borderWidth: 1,
    borderColor: '#DCE6EC',
    borderRadius: 12,
    backgroundColor: '#FAFCFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  recipeDetailMoreMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  recipeDetailMoreMenuItemText: {
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  recipeDetailMoreMenuItemTextDanger: {
    color: '#DC2626',
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
    position: 'relative',
  },
  recipeDetailPhotoQuickActions: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    gap: 8,
    alignItems: 'flex-end',
  },
  recipeDetailPhotoQuickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#DCE6EC',
    borderRadius: 999,
    backgroundColor: 'rgba(250, 252, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  recipeDetailPhotoQuickActionText: {
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 12,
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
  recipeDetailInfoBox: {
    borderWidth: 1,
    borderColor: '#DCE6EC',
    borderRadius: 12,
    backgroundColor: '#EDF5FF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  recipeDetailInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recipeDetailInfoText: {
    flex: 1,
    color: palette.text,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 0,
  },
  recipeDetailSourceText: {
    color: palette.accent,
    fontFamily: fonts.medium,
    textDecorationLine: 'underline',
  },
  recipeDetailSourceRow: {
    borderRadius: 8,
  },
  recipeViewActionsCard: {
    borderTopWidth: 1,
    borderTopColor: '#E3DED4',
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  recipeViewActionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexWrap: 'nowrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  recipeCookedToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },
  recipeCookedToggleText: {
    color: palette.accent,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 16,
  },
  recipeCookedToggleIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D8D3CB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeCookedToggleIconWrapActive: {
    backgroundColor: '#98A9C8',
  },
  recipeRatingStarsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 'auto',
    flexShrink: 0,
  },
  recipeCookedNoteInput: {
    borderRadius: 18,
    backgroundColor: '#EAE8E3',
    color: palette.accent,
    fontFamily: fonts.regular,
    fontSize: 16,
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  recipeVisibilityToggle: {
    borderWidth: 1,
    borderColor: '#DCE6EC',
    borderRadius: 12,
    backgroundColor: '#FAFCFF',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  recipeVisibilityToggleText: {
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 13,
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
  recipeDetailDescriptionInput: {
    color: palette.accent,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 0,
    minHeight: 78,
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
  recipeDetailStepsHeaderRow: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recipeDetailReorderButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  recipeDetailReorderText: {
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  recipeDetailStepCard: {
    backgroundColor: '#FAFCFF',
    borderRadius: 10,
    padding: 6,
    borderWidth: 1,
    borderColor: '#DCE6EC',
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  recipeDetailStepPhotoTile: {
    width: 42,
    height: 42,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#C6D4E8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  recipeDetailStepPhotoTileImage: {
    width: '100%',
    height: '100%',
  },
  recipeDetailStepCardContent: {
    flex: 1,
  },
  recipeDetailStepTextRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  recipeDetailStepIndexText: {
    color: '#8B9AAA',
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 1,
  },
  recipeDetailStepCardInput: {
    flex: 1,
    color: palette.accent,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 44,
    paddingTop: 0,
    paddingBottom: 0,
  },
  recipeDetailStepCardText: {
    flex: 1,
    color: palette.accent,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  recipeDetailStepCardFooter: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  recipeDetailStepDragArea: {
    marginRight: 'auto',
  },
  recipeDetailStepDragHandle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#D6DBE6',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeDetailStepDragHandleActive: {
    borderColor: '#9FB4D6',
    backgroundColor: '#F0F6FF',
  },
  recipeDetailStepRemoveButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D6DBE6',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  recipeDetailAddStepButton: {
    marginTop: 4,
    marginBottom: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.accent,
    backgroundColor: palette.card,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  recipeDetailAddStepButtonText: {
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 14,
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
  cookbookRecipeDescription: {
    marginTop: 2,
    color: palette.mutedText,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  recipeSearchResultContent: {
    flex: 1,
  },
  recipeSearchResultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recipeSearchAuthorBadge: {
    marginLeft: 2,
  },
  recipeSearchResultMeta: {
    marginTop: 2,
    color: palette.mutedText,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  recipeSearchResultMetaPrefix: {
    color: palette.mutedText,
    fontFamily: fonts.regular,
  },
  recipeSearchResultMetaName: {
    color: palette.accent,
    fontFamily: fonts.semiBold,
  },
  recipeSearchResultMetaAuthor: {
    color: '#1D9BF0',
    fontFamily: fonts.medium,
  },
  cameraImportOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  cameraImportBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  cameraImportPopup: {
    backgroundColor: palette.card,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#DCE6EC',
    gap: spacing.sm,
  },
  cameraImportTitle: {
    color: palette.accent,
    fontFamily: fonts.semiBold,
    fontSize: 20,
  },
  cameraImportSubtitle: {
    color: palette.text,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  cameraImportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#DCE6EC',
    borderRadius: 12,
    backgroundColor: '#FAFCFF',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  cameraImportOptionText: {
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  cameraImportCancel: {
    alignSelf: 'flex-end',
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cameraImportCancelText: {
    color: palette.mutedText,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  imageImportLoadingCard: {
    alignSelf: 'center',
    minWidth: 220,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCE6EC',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  imageImportLoadingText: {
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  recipeMoreMenuPopup: {
    backgroundColor: palette.card,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#DCE6EC',
    gap: spacing.sm,
  },
  recipeMoreMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#DCE6EC',
    borderRadius: 12,
    backgroundColor: '#FAFCFF',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  recipeMoreMenuItemText: {
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  recipeMoreMenuItemTextDanger: {
    color: '#DC2626',
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  recipeMoreMenuCancel: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  recipeMoreMenuCancelText: {
    color: palette.mutedText,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  recipeDeleteConfirmTitle: {
    color: palette.accent,
    fontFamily: fonts.semiBold,
    fontSize: 20,
  },
  recipeDeleteConfirmText: {
    color: palette.text,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  recipeDeleteConfirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: 6,
  },
  recipeDeleteConfirmButton: {
    backgroundColor: '#DC2626',
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
  planRecipeSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#C6D4E8',
    borderRadius: 10,
    backgroundColor: '#FAFCFF',
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  planRecipeSearchInput: {
    flex: 1,
    color: palette.accent,
    fontFamily: fonts.regular,
    fontSize: 13,
    paddingVertical: 8,
  },
  planRecipeOptionsList: {
    maxHeight: 180,
    marginBottom: spacing.sm,
  },
  planAssignDateQuestion: {
    color: palette.mutedText,
    fontFamily: fonts.medium,
    fontSize: 12,
    marginBottom: 6,
  },
  planAssignDateModeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: 8,
  },
  planAssignDateModeButton: {
    borderWidth: 1,
    borderColor: '#C6D4E8',
    borderRadius: 10,
    backgroundColor: '#FAFCFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  planAssignDateModeButtonSelected: {
    borderColor: palette.button,
    backgroundColor: '#EDF5FF',
  },
  planAssignDateModeButtonText: {
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  planAssignDateModeButtonTextSelected: {
    color: palette.button,
  },
  planAssignDateSelectedText: {
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  planAssignDatePickerWrap: {
    marginBottom: spacing.sm,
  },
  planAssignDatePickerList: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  planAssignDateChip: {
    borderWidth: 1,
    borderColor: '#C6D4E8',
    borderRadius: 999,
    backgroundColor: '#FAFCFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  planAssignDateChipSelected: {
    borderColor: palette.button,
    backgroundColor: '#EDF5FF',
  },
  planAssignDateChipText: {
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  planAssignDateChipTextSelected: {
    color: palette.button,
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
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 16,
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
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  manualTitleInput: {
    flex: 1,
    color: palette.card,
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 28,
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
  manualVisibilityToggle: {
    borderWidth: 1,
    borderColor: '#DCE6EC',
    borderRadius: 12,
    backgroundColor: '#FAFCFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  manualVisibilityToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  manualVisibilityToggleLabel: {
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  manualVisibilityToggleAction: {
    color: palette.mutedText,
    fontFamily: fonts.regular,
    fontSize: 12,
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
