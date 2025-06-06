import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { TouchableOpacity } from 'react-native'

const CustomButton = ({title, handlePress, containerStyles, textStyles, isLoading, disabled}) => {
  return (
    <TouchableOpacity 
    className={`bg-secondary rounded-xl min-h-[62px] justify-center items-center ${containerStyles} ${isLoading || disabled ? 'opacity-50' : '' }`}
    disabled={isLoading || disabled}
    onPress={handlePress}
    activeOpacity={0.7}
    >
      <Text
      className={`text-primary font-psemibold text-lg ${textStyles}`}
      >
        {title}
      </Text>
    </TouchableOpacity>
  )
}

export default CustomButton;

const styles = StyleSheet.create({})