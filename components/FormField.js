import { StyleSheet, Text, View ,TextInput, TouchableOpacity, Image} from 'react-native'
import React, { useState } from 'react'
import  icon1 from '../assets/icons/eye.png'
import  icon2 from '../assets/icons/eye-hide.png'

const FormField = ({title, value, placeholder, handleChangeText, otherStyles, disabled, ...props}) => {
  
  const [showpw, setshowpw] = useState(false)


  return (
    <View className={`my-3 ${otherStyles}`}>
      <Text className="text-base text-gray-100 font-pmedium">{title}</Text>

      <View className={`w-full border-2 border-black-200 px-4 border-black-200 h-16 bg-black-100 rounded-2xl items-center focus:border-secondary flex-row ${disabled ? 'opacity-50' : ''}`}>
      <TextInput
      className="flex-1 text-white font-psemibold text-base"
      value={value}
      placeholder={placeholder}
      placeholderTextColor="#7b7b8b"
      onChangeText={handleChangeText}
      secureTextEntry={
        title === 'Password' && !showpw
      }
      editable={!disabled}
      {...props}
      />
      
      {title === 'Password' && (
        <TouchableOpacity
        onPress={() => setshowpw(!showpw)}
        disabled={disabled}
        >
        <Image
        source={!showpw ? icon1 : icon2}
        resizeMode='contain'
        className = "w-6 h-6"
        />
        </TouchableOpacity>
      )}
      
      


      </View>
    </View>
  )
}

export default FormField

