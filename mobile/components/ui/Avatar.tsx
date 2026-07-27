import { useState } from 'react';
import { Text, Image, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients, marca } from '../../lib/theme';
import { iniciales } from '../../lib/format';
import { urlArchivo } from '../../lib/archivoUrl';

interface AvatarProps {
  nombre?: string;
  apellido?: string;
  /** Ruta que devuelve la API ("/uploads/avatar-x.jpg"). Sin esto se muestran las iniciales. */
  uri?: string | null;
  size?: number;
  /** 'squircle' = cuadrado redondeado, el que usan las pantallas de perfil. */
  shape?: 'circle' | 'squircle';
}

/**
 * Avatar del usuario: la foto si la tiene, y si no las iniciales sobre la pastilla menta de la
 * marca (igual que la web: bg-mint-grad con el texto en color rail).
 *
 * No usa useTheme(): la menta es color de marca y se ve bien en claro y en oscuro.
 *
 * `shape` es una prop y no algo que se pase por className porque el `cn` del proyecto es un
 * join de strings, no tailwind-merge: un `rounded-2xl` de afuera no le gana al radio propio.
 */
export function Avatar({ nombre, apellido, uri, size = 40, shape = 'circle' }: AvatarProps) {
  // Si el archivo se borró del disco (los uploads son efímeros en Render), mejor caer a las
  // iniciales que mostrar el ícono de imagen rota.
  const [falla, setFalla] = useState(false);

  const radio = shape === 'circle' ? size / 2 : Math.round(size * 0.28);
  const base = { width: size, height: size, borderRadius: radio } as const;
  const fuente = urlArchivo(uri);

  if (fuente && !falla) {
    return (
      <View style={[base, { overflow: 'hidden' }]}>
        <Image
          source={{ uri: fuente }}
          style={{ width: size, height: size }}
          resizeMode="cover"
          onError={() => setFalla(true)}
          accessibilityIgnoresInvertColors
        />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={gradients.mint}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ ...base, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ color: marca.rail, fontWeight: '700', fontSize: Math.round(size * 0.38) }}>
        {iniciales(nombre, apellido)}
      </Text>
    </LinearGradient>
  );
}
