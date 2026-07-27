import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

interface IconProps {
  className?: string;
}

function Icon({ children, className }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('w-4 h-4 shrink-0', className)}
    >
      {children}
    </svg>
  );
}

export const IconGrid = (p: IconProps) => (
  <Icon {...p}><path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></Icon>
);

export const IconCalendar = (p: IconProps) => (
  <Icon {...p}><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></Icon>
);

export const IconUsers = (p: IconProps) => (
  <Icon {...p}><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></Icon>
);

export const IconUser = (p: IconProps) => (
  <Icon {...p}><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></Icon>
);

export const IconTag = (p: IconProps) => (
  <Icon {...p}><path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></Icon>
);

export const IconChart = (p: IconProps) => (
  <Icon {...p}><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></Icon>
);

export const IconSettings = (p: IconProps) => (
  <Icon {...p}><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></Icon>
);

export const IconPlus = (p: IconProps) => (
  <Icon {...p}><path d="M12 4v16m8-8H4" /></Icon>
);

export const IconDoc = (p: IconProps) => (
  <Icon {...p}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></Icon>
);

export const IconFolder = (p: IconProps) => (
  <Icon {...p}><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></Icon>
);

export const IconLogout = (p: IconProps) => (
  <Icon {...p}><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></Icon>
);

export const IconMenu = (p: IconProps) => (
  <Icon {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Icon>
);

export const IconX = (p: IconProps) => (
  <Icon {...p}><path d="M6 18L18 6M6 6l12 12" /></Icon>
);

export const IconCheck = (p: IconProps) => (
  <Icon {...p}><path d="M5 13l4 4L19 7" /></Icon>
);

export const IconChevronDown = (p: IconProps) => (
  <Icon {...p}><path d="M19 9l-7 7-7-7" /></Icon>
);

export const IconChevronLeft = (p: IconProps) => (
  <Icon {...p}><path d="M15 19l-7-7 7-7" /></Icon>
);

export const IconChevronRight = (p: IconProps) => (
  <Icon {...p}><path d="M9 5l7 7-7 7" /></Icon>
);

export const IconArrowRight = (p: IconProps) => (
  <Icon {...p}><path d="M14 5l7 7m0 0l-7 7m7-7H3" /></Icon>
);

export const IconSearch = (p: IconProps) => (
  <Icon {...p}><path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></Icon>
);

export const IconClock = (p: IconProps) => (
  <Icon {...p}><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></Icon>
);

export const IconTrash = (p: IconProps) => (
  <Icon {...p}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></Icon>
);

export const IconEdit = (p: IconProps) => (
  <Icon {...p}><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></Icon>
);

export const IconDots = (p: IconProps) => (
  <Icon {...p}><path d="M12 5.25a.75.75 0 110-1.5.75.75 0 010 1.5zm0 7.5a.75.75 0 110-1.5.75.75 0 010 1.5zm0 7.5a.75.75 0 110-1.5.75.75 0 010 1.5z" /></Icon>
);

export const IconCamera = (p: IconProps) => (
  <Icon {...p}><path d="M3 9a2 2 0 012-2h1.5l1.2-2h6.6l1.2 2H19a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><circle cx="12" cy="13" r="3.2" /></Icon>
);

export const IconImage = (p: IconProps) => (
  <Icon {...p}><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></Icon>
);

export const IconUpload = (p: IconProps) => (
  <Icon {...p}><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></Icon>
);

export const IconDownload = (p: IconProps) => (
  <Icon {...p}><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></Icon>
);

export const IconAlert = (p: IconProps) => (
  <Icon {...p}><path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></Icon>
);

export const IconInfo = (p: IconProps) => (
  <Icon {...p}><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></Icon>
);

export const IconPill = (p: IconProps) => (
  <Icon {...p}><path d="M10.5 20.5L3.5 13.5a4.95 4.95 0 117-7l7 7a4.95 4.95 0 11-7 7zM7 10l7 7" /></Icon>
);

export const IconStethoscope = (p: IconProps) => (
  <Icon {...p}><path d="M5 3v6a5 5 0 0010 0V3M5 3H4m1 0h2m8 0h-1m1 0h2m-4 11v3a4 4 0 008 0v-2m0 0a2 2 0 10-.001-4.001A2 2 0 0019 15z" /></Icon>
);

export const IconHeart = (p: IconProps) => (
  <Icon {...p}><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></Icon>
);

export const IconEye = (p: IconProps) => (
  <Icon {...p}><path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></Icon>
);

export const IconEyeOff = (p: IconProps) => (
  <Icon {...p}><path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></Icon>
);

export const IconShield = (p: IconProps) => (
  <Icon {...p}><path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></Icon>
);

export const IconKey = (p: IconProps) => (
  <Icon {...p}><path d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></Icon>
);

export const IconBuilding = (p: IconProps) => (
  <Icon {...p}><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3m4-10h2m4 0h2M9 7h2m4 0h2m-8 8h2m4 0h2" /></Icon>
);

export const IconSparkle = (p: IconProps) => (
  <Icon {...p}><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.456-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" /></Icon>
);

export const IconHome = (p: IconProps) => (
  <Icon {...p}><path d="M2.25 12l8.954-8.955a1.5 1.5 0 012.122 0L21.75 12M4.5 9.75v9.75a.75.75 0 00.75.75H9.75V15a.75.75 0 01.75-.75h3a.75.75 0 01.75.75v5.25h4.5a.75.75 0 00.75-.75V9.75" /></Icon>
);

export const IconBell = (p: IconProps) => (
  <Icon {...p}><path d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></Icon>
);

export const IconActivity = (p: IconProps) => (
  <Icon {...p}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></Icon>
);

export const IconCalendarDays = (p: IconProps) => (
  <Icon {...p}><path d="M8 2v3m8-3v3M3.5 9.5h17M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" /><path d="M7.5 13h.01M12 13h.01M16.5 13h.01M7.5 17h.01M12 17h.01" /></Icon>
);

export const IconArrowUpRight = (p: IconProps) => (
  <Icon {...p}><path d="M6 18L18 6m0 0H9m9 0v9" /></Icon>
);

export const IconCheckCircle = (p: IconProps) => (
  <Icon {...p}><path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></Icon>
);

export const IconClipboard = (p: IconProps) => (
  <Icon {...p}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8h6m-6 4h4" /></Icon>
);

export const IconCornerDownLeft = (p: IconProps) => (
  <Icon {...p}><path d="M20 4v7a4 4 0 01-4 4H4m0 0l5-5m-5 5l5 5" /></Icon>
);

export const IconPhone = (p: IconProps) => (
  <Icon {...p}><path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></Icon>
);

export const IconMail = (p: IconProps) => (
  <Icon {...p}><path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></Icon>
);

export const IconMapPin = (p: IconProps) => (
  <Icon {...p}><path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></Icon>
);

export const IconFilter = (p: IconProps) => (
  <Icon {...p}><path d="M3.75 5.25h16.5L13.5 13.5v5.25L10.5 21v-7.5z" /></Icon>
);

export const IconChevronsUpDown = (p: IconProps) => (
  <Icon {...p}><path d="M7 8l5-5 5 5M7 16l5 5 5-5" /></Icon>
);

export const IconIdCard = (p: IconProps) => (
  <Icon {...p}><path d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /><path d="M7 10a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zM6.5 16a2.5 2.5 0 015 0M14 9.5h4M14 13h4M14 16h2.5" /></Icon>
);

export const IconSun = (p: IconProps) => (
  <Icon {...p}><path d="M12 3v1.5M12 19.5V21M4.22 4.22l1.06 1.06M18.72 18.72l1.06 1.06M3 12h1.5M19.5 12H21M4.22 19.78l1.06-1.06M18.72 5.28l1.06-1.06" /><path d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></Icon>
);

export const IconMoon = (p: IconProps) => (
  <Icon {...p}><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" /></Icon>
);

export const IconChevronsLeft = (p: IconProps) => (
  <Icon {...p}><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" /></Icon>
);

export const IconPrinter = (p: IconProps) => (
  <Icon {...p}><path d="M7 8V4a1 1 0 011-1h8a1 1 0 011 1v4M7 18H5a2 2 0 01-2-2v-5a2 2 0 012-2h14a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><path d="M7 15h10v5a1 1 0 01-1 1H8a1 1 0 01-1-1v-5z" /></Icon>
);

export const IconChat = (p: IconProps) => (
  <Icon {...p}><path d="M21 11.5a8.5 8.5 0 01-9.1 8.48 8.4 8.4 0 01-3.4-.88L3 21l1.9-5.5a8.4 8.4 0 01-.9-3.8 8.5 8.5 0 018.48-9.1A8.5 8.5 0 0121 11.5z" /></Icon>
);

export const IconSend = (p: IconProps) => (
  <Icon {...p}><path d="M21.5 12L3 4l3.5 8L3 20l18.5-8zM6.5 12h15" /></Icon>
);