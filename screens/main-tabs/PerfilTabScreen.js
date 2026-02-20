import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

export default function PerfilTabScreen({
  styles,
  profileDisplayName,
  profileAvatarUrl,
  userEmail,
  onLogout,
}) {
  const resolvedName = useMemo(
    () => String(profileDisplayName || '').trim() || 'Usuario SaveMyDish',
    [profileDisplayName]
  );
  const resolvedAvatarUrl = useMemo(
    () => String(profileAvatarUrl || '').trim(),
    [profileAvatarUrl]
  );

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileNameInput, setProfileNameInput] = useState(resolvedName);
  const [profilePhotoInput, setProfilePhotoInput] = useState(resolvedAvatarUrl);
  const [profileFeedback, setProfileFeedback] = useState('');
  const [profileFeedbackKind, setProfileFeedbackKind] = useState('info');
  const [isPlusModalVisible, setIsPlusModalVisible] = useState(false);
  const [isDeleteAccountModalVisible, setIsDeleteAccountModalVisible] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const feedbackTones = {
    success: {
      backgroundColor: '#e6f4ea',
      borderColor: '#9bc9a8',
      textColor: '#1f5c34',
      icon: 'checkmark-circle-outline',
    },
    error: {
      backgroundColor: '#fdebec',
      borderColor: '#e3a8ac',
      textColor: '#8d2b33',
      icon: 'alert-circle-outline',
    },
    info: {
      backgroundColor: '#e9f0fb',
      borderColor: '#afc3e8',
      textColor: '#274a84',
      icon: 'information-circle-outline',
    },
  };

  const showFeedback = (message, kind = 'info') => {
    setProfileFeedback(message);
    setProfileFeedbackKind(kind);
  };

  useEffect(() => {
    if (isEditingProfile) {
      return;
    }
    setProfileNameInput(resolvedName);
    setProfilePhotoInput(resolvedAvatarUrl);
  }, [isEditingProfile, resolvedAvatarUrl, resolvedName]);

  const handlePickProfilePhoto = async () => {
    if (!isEditingProfile || isSavingProfile) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      showFeedback('Debes permitir acceso a tus fotos para actualizar tu perfil.', 'error');
      return;
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
    setProfilePhotoInput(photoUrl);
    setProfileFeedback('');
    setProfileFeedbackKind('info');
  };

  const handleStartProfileEdit = () => {
    setProfileNameInput(resolvedName);
    setProfilePhotoInput(resolvedAvatarUrl);
    setProfileFeedback('');
    setProfileFeedbackKind('info');
    setIsEditingProfile(true);
  };

  const handleCancelProfileEdit = () => {
    setProfileNameInput(resolvedName);
    setProfilePhotoInput(resolvedAvatarUrl);
    setProfileFeedback('');
    setProfileFeedbackKind('info');
    setIsEditingProfile(false);
  };

  const handleSaveProfile = async () => {
    const cleanName = String(profileNameInput || '').trim();
    if (!cleanName) {
      showFeedback('El nombre es obligatorio.', 'error');
      return;
    }

    if (!supabase || !isSupabaseConfigured) {
      showFeedback('Configura Supabase para guardar cambios de perfil.', 'error');
      return;
    }

    setIsSavingProfile(true);
    setProfileFeedback('');
    setProfileFeedbackKind('info');
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: cleanName,
        avatar_url: String(profilePhotoInput || '').trim() || null,
      },
    });
    setIsSavingProfile(false);

    if (error) {
      showFeedback('No se pudo actualizar el perfil.', 'error');
      return;
    }

    setIsEditingProfile(false);
    showFeedback('Perfil actualizado correctamente.', 'success');
  };

  const handleOpenPlaceholder = () => {
    showFeedback('Disponible pronto.', 'info');
  };

  const handleShareWithFriends = async () => {
    const shareLink = 'https://www.savemydish.com';
    const shareMessage =
      'Quiero que conozcas SaveMyDish. Sé que te va a encantar para organizar tus recetas, planificar comidas y llevar tu lista de compras de forma fácil.\n\nDescárgala aquí: https://www.savemydish.com';
    try {
      await Share.share({
        title: 'SaveMyDish',
        message: shareMessage,
        url: shareLink,
      });
    } catch (_error) {
      showFeedback('No se pudo abrir el menú de compartir en este dispositivo.', 'error');
    }
  };

  const handleOpenPlusInterestMessage = () => {
    setIsPlusModalVisible(true);
  };

  const getValidAccessToken = async () => {
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

    return accessToken;
  };

  const handleOpenDeleteAccountModal = () => {
    if (isSavingProfile || isDeletingAccount) {
      return;
    }
    setIsDeleteAccountModalVisible(true);
  };

  const handleCloseDeleteAccountModal = () => {
    if (isDeletingAccount) {
      return;
    }
    setIsDeleteAccountModalVisible(false);
  };

  const handleConfirmDeleteAccount = async () => {
    if (isDeletingAccount) {
      return;
    }

    if (!supabase || !isSupabaseConfigured) {
      showFeedback('Configura Supabase para cerrar cuenta.', 'error');
      setIsDeleteAccountModalVisible(false);
      return;
    }

    setIsDeletingAccount(true);
    setProfileFeedback('');
    setProfileFeedbackKind('info');

    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        showFeedback('Tu sesión expiró. Inicia sesión de nuevo para cerrar tu cuenta.', 'error');
        return;
      }

      supabase.functions.setAuth(accessToken);
      let { error, data } = await supabase.functions.invoke('delete-user-account', {
        body: {},
      });

      if (error) {
        const errorMessage = String(error?.message || '').toLowerCase();
        const unauthorizedError =
          errorMessage.includes('401') || errorMessage.includes('unauthorized');

        if (unauthorizedError) {
          const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession();
          const refreshedToken = refreshedData?.session?.access_token || '';
          if (!refreshError && refreshedToken) {
            supabase.functions.setAuth(refreshedToken);
            const retryResponse = await supabase.functions.invoke('delete-user-account', {
              body: {},
            });
            error = retryResponse.error;
            data = retryResponse.data;
          }
        }
      }

      if (error) {
        showFeedback('No se pudo cerrar tu cuenta en este momento.', 'error');
        return;
      }

      if (!data?.success) {
        const backendMessage = String(data?.error || '').trim();
        showFeedback(
          backendMessage || 'No se pudo completar el cierre de cuenta.',
          'error'
        );
        return;
      }

      setIsDeleteAccountModalVisible(false);
      setProfileFeedback('');
      setProfileFeedbackKind('info');
      if (typeof onLogout === 'function') {
        await Promise.resolve(onLogout());
      }
    } catch (_error) {
      showFeedback('No se pudo cerrar tu cuenta en este momento.', 'error');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const displayName = String(profileNameInput || '').trim() || resolvedName;
  const displayAvatar = String(profilePhotoInput || '').trim();
  const activeFeedbackTone = feedbackTones[profileFeedbackKind] || feedbackTones.info;

  return (
    <View>
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.body}>Administra tu cuenta, tu foto y tus preferencias.</Text>
      <View style={styles.profileCard}>
        {!isEditingProfile ? (
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              zIndex: 4,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              borderWidth: 1,
              borderColor: '#D9E4F1',
              borderRadius: 999,
              backgroundColor: '#F7FAFF',
              paddingHorizontal: 10,
              paddingVertical: 6,
            }}
            onPress={handleStartProfileEdit}
            disabled={isSavingProfile || isDeletingAccount}
            activeOpacity={0.85}
          >
            <Ionicons name="create-outline" size={13} color="#4C648E" />
            <Text style={{ color: '#4C648E', fontSize: 12, fontWeight: '600' }}>Editar</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={styles.profilePhotoButton}
          onPress={() => {
            void handlePickProfilePhoto();
          }}
          activeOpacity={isEditingProfile ? 0.85 : 1}
          disabled={!isEditingProfile || isSavingProfile}
        >
          {displayAvatar ? (
            <Image source={{ uri: displayAvatar }} style={styles.profilePhotoImage} resizeMode="cover" />
          ) : (
            <View style={styles.profilePhotoPlaceholder}>
              <Ionicons name="person-outline" size={36} color={styles.logoutText.color} />
            </View>
          )}
          {isEditingProfile ? (
            <View style={styles.profilePhotoEditBadge}>
              <Ionicons name="camera-outline" size={14} color={styles.logoutText.color} />
            </View>
          ) : null}
        </TouchableOpacity>

        {isEditingProfile ? (
          <TextInput
            style={styles.profileNameInput}
            value={profileNameInput}
            onChangeText={setProfileNameInput}
            placeholder="Nombre del usuario"
            placeholderTextColor={styles.sessionText.color}
            editable={!isSavingProfile}
          />
        ) : (
          <Text style={styles.profileNameText}>{displayName}</Text>
        )}

        <Text style={styles.profileEmailText}>{userEmail || 'Sin correo'}</Text>

        {isEditingProfile ? (
          <TouchableOpacity
            style={{
              alignSelf: 'center',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginTop: -4,
              marginBottom: 12,
            }}
            onPress={handleOpenDeleteAccountModal}
            disabled={isDeletingAccount || isSavingProfile}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={15} color="#B9384E" />
            <Text style={{ color: '#B9384E', fontSize: 13, fontWeight: '600' }}>Cerrar Cuenta</Text>
          </TouchableOpacity>
        ) : null}

        {isEditingProfile ? (
          <View style={localStyles.profileEditActionsRow}>
            <TouchableOpacity
              style={[
                localStyles.profileEditActionButton,
                localStyles.profileEditCancelButton,
                isSavingProfile && styles.buttonDisabled,
              ]}
              onPress={handleCancelProfileEdit}
              disabled={isSavingProfile}
            >
              <Text style={localStyles.profileEditCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                localStyles.profileEditActionButton,
                localStyles.profileEditSaveButton,
                isSavingProfile && styles.buttonDisabled,
              ]}
              onPress={handleSaveProfile}
              disabled={isSavingProfile}
            >
              {isSavingProfile ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={localStyles.profileEditSaveText}>Guardar perfil</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        {profileFeedback ? (
          <View
            style={{
              marginTop: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: activeFeedbackTone.borderColor,
              backgroundColor: activeFeedbackTone.backgroundColor,
              paddingHorizontal: 12,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Ionicons name={activeFeedbackTone.icon} size={16} color={activeFeedbackTone.textColor} />
            <Text style={{ flex: 1, color: activeFeedbackTone.textColor, fontSize: 13, lineHeight: 18 }}>
              {profileFeedback}
            </Text>
          </View>
        ) : null}

        <View style={styles.profileDivider} />

        <TouchableOpacity style={styles.profilePlusButton} onPress={handleOpenPlusInterestMessage}>
          <Ionicons name="sparkles-outline" size={18} color={styles.profilePlusButtonText.color} />
          <Text style={styles.profilePlusButtonText}>Actualizar a SaveMyDish Plus</Text>
        </TouchableOpacity>

        <View style={styles.profileDivider} />

        <TouchableOpacity
          style={styles.profileMenuRow}
          onPress={() => {
            void handleShareWithFriends();
          }}
        >
          <Ionicons name="share-social-outline" size={18} color={styles.profileMenuText.color} />
          <Text style={styles.profileMenuText}>Compartir con Amigos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.profileMenuRow} onPress={handleOpenPlaceholder}>
          <Ionicons name="help-circle-outline" size={18} color={styles.profileMenuText.color} />
          <Text style={styles.profileMenuText}>Ayuda</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.profileMenuRow} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={18} color={styles.profileMenuText.color} />
          <Text style={styles.profileMenuText}>Cerrar Sesion</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isPlusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPlusModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(20, 31, 51, 0.38)',
            justifyContent: 'center',
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              backgroundColor: '#f6f7fb',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#c2d2ee',
              paddingHorizontal: 18,
              paddingVertical: 18,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: '800',
                color: '#1e3a76',
                marginBottom: 8,
              }}
            >
              SaveMyDish Plus
            </Text>
            <Text
              style={{
                fontSize: 14,
                lineHeight: 21,
                color: '#284471',
                marginBottom: 14,
              }}
            >
              Gracias por tu interés. Estamos desarrollando nuevas funcionalidades y mejoras para mejorar tu
              experiencia. Pronto estará listo. Puedes disfrutar todas las funciones de SaveMyDish y no olvides
              compartirlo con tus amigos.
            </Text>
            <TouchableOpacity
              onPress={() => setIsPlusModalVisible(false)}
              style={{
                alignSelf: 'flex-end',
                backgroundColor: '#7d98cc',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '700' }}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isDeleteAccountModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseDeleteAccountModal}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(20, 31, 51, 0.44)',
            justifyContent: 'center',
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              backgroundColor: '#fff6f7',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#e4b8c0',
              paddingHorizontal: 18,
              paddingVertical: 18,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: '800',
                color: '#94273a',
                marginBottom: 8,
              }}
            >
              Cerrar Cuenta
            </Text>
            <Text
              style={{
                fontSize: 14,
                lineHeight: 21,
                color: '#5e1f2d',
                marginBottom: 16,
              }}
            >
              Esta acción eliminará tu cuenta y todo tu contenido (recetas, recetarios, plan, lista y
              configuraciones). Esta acción no se puede deshacer.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity
                onPress={handleCloseDeleteAccountModal}
                style={{
                  borderWidth: 1,
                  borderColor: '#c6d4e8',
                  backgroundColor: '#ffffff',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}
                disabled={isDeletingAccount}
              >
                <Text style={{ color: '#214f4b', fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  void handleConfirmDeleteAccount();
                }}
                style={{
                  backgroundColor: '#b9384e',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  minWidth: 148,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={{ color: '#ffffff', fontWeight: '700' }}>Si, borrar todo</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const localStyles = StyleSheet.create({
  profileEditActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  profileEditActionButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  profileEditCancelButton: {
    borderWidth: 1,
    borderColor: '#C8D5E8',
    backgroundColor: '#FFFFFF',
  },
  profileEditSaveButton: {
    backgroundColor: '#7B94C4',
  },
  profileEditCancelText: {
    color: '#385069',
    fontSize: 17,
    fontWeight: '600',
  },
  profileEditSaveText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
