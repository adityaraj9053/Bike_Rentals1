import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export default function WhatsAppIcon({
  size = 18,
  color = '#FFFFFF',
  withCircle = false,
  circleSize = 26,
  circleColor = '#25D366',
}) {
  const icon = (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 20.16C10.57 20.16 9.12 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.16 12.05 20.16ZM16.57 14.39C16.32 14.27 15.1 13.67 14.88 13.58C14.65 13.5 14.49 13.46 14.32 13.7C14.16 13.95 13.69 14.51 13.54 14.67C13.4 14.84 13.25 14.86 13 14.74C12.75 14.61 11.95 14.35 11 13.5C10.26 12.84 9.76 12.03 9.61 11.78C9.47 11.54 9.6 11.4 9.72 11.28C9.83 11.17 9.97 10.99 10.09 10.85C10.22 10.71 10.26 10.61 10.34 10.45C10.42 10.28 10.38 10.14 10.32 10.02C10.26 9.9 9.77 8.7 9.57 8.21C9.37 7.73 9.17 7.79 9.02 7.78C8.88 7.78 8.71 7.77 8.55 7.77C8.38 7.77 8.12 7.83 7.89 8.08C7.67 8.32 7.03 8.92 7.03 10.14C7.03 11.36 7.92 12.54 8.04 12.7C8.16 12.87 9.79 15.37 12.28 16.44C12.87 16.7 13.33 16.85 13.69 16.97C14.29 17.16 14.83 17.13 15.26 17.07C15.74 17 16.74 16.47 16.95 15.89C17.15 15.3 17.15 14.8 17.09 14.7C17.03 14.6 16.82 14.51 16.57 14.39Z" />
    </Svg>
  );

  if (withCircle) {
    return (
      <View
        style={{
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
          backgroundColor: circleColor,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#25D366',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.3,
          shadowRadius: 3,
          elevation: 2,
        }}
      >
        {icon}
      </View>
    );
  }

  return icon;
}
