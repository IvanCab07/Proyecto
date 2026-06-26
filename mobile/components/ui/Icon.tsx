import type { ComponentProps } from 'react';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';

// Set de íconos nombrados (espeja web/src/ui/icons.tsx). Trazo fino con Feather;
// los médicos con MaterialCommunityIcons. Las pantallas nunca importan vector-icons directo.

export type IconProps = { size?: number; color?: string };

type FeatherName = ComponentProps<typeof Feather>['name'];
type MCIName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const makeF = (name: FeatherName) =>
  function FeatherIcon({ size = 20, color = colors.slate[600] }: IconProps) {
    return <Feather name={name} size={size} color={color} />;
  };
const makeM = (name: MCIName) =>
  function MCIcon({ size = 20, color = colors.slate[600] }: IconProps) {
    return <MaterialCommunityIcons name={name} size={size} color={color} />;
  };

export const IconHome = makeF('home');
export const IconGrid = makeF('grid');
export const IconCalendar = makeF('calendar');
export const IconClock = makeF('clock');
export const IconPlus = makeF('plus');
export const IconUser = makeF('user');
export const IconUserPlus = makeF('user-plus');
export const IconUsers = makeF('users');
export const IconFileText = makeF('file-text');
export const IconFolder = makeF('folder');
export const IconSettings = makeF('settings');
export const IconSearch = makeF('search');
export const IconChevronRight = makeF('chevron-right');
export const IconChevronLeft = makeF('chevron-left');
export const IconChevronDown = makeF('chevron-down');
export const IconX = makeF('x');
export const IconCheck = makeF('check');
export const IconCheckCircle = makeF('check-circle');
export const IconAlertTriangle = makeF('alert-triangle');
export const IconAlertCircle = makeF('alert-circle');
export const IconInfo = makeF('info');
export const IconEye = makeF('eye');
export const IconEyeOff = makeF('eye-off');
export const IconMapPin = makeF('map-pin');
export const IconPhone = makeF('phone');
export const IconCamera = makeF('camera');
export const IconUpload = makeF('upload');
export const IconDownload = makeF('download');
export const IconRefresh = makeF('refresh-cw');
export const IconArrowRight = makeF('arrow-right');
export const IconArrowLeft = makeF('arrow-left');
export const IconLogout = makeF('log-out');
export const IconLogin = makeF('log-in');
export const IconEdit = makeF('edit-2');
export const IconTrash = makeF('trash-2');
export const IconBell = makeF('bell');
export const IconMail = makeF('mail');
export const IconLock = makeF('lock');
export const IconActivity = makeF('activity');
export const IconChart = makeF('bar-chart-2');
export const IconTag = makeF('tag');
export const IconImage = makeF('image');
export const IconServer = makeF('server');
export const IconWifi = makeF('wifi');
export const IconShield = makeF('shield');
export const IconSliders = makeF('sliders');
export const IconList = makeF('list');
export const IconMore = makeF('more-vertical');
export const IconHeart = makeF('heart');
export const IconExternal = makeF('external-link');
export const IconClipboard = makeF('clipboard');
export const IconKey = makeF('key');

export const IconStar = makeM('star');
export const IconStarOutline = makeM('star-outline');

// Médicos
export const IconPill = makeM('pill');
export const IconStethoscope = makeM('stethoscope');
export const IconDoctor = makeM('doctor');
export const IconHospital = makeM('hospital-box');
export const IconCalendarCheck = makeM('calendar-check');
export const IconCalendarPlus = makeM('calendar-plus');
