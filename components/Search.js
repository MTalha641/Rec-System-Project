import { StyleSheet, Text, View ,TextInput, TouchableOpacity, Image} from 'react-native'
import React, { useState } from 'react'

import icon1 from '../assets/icons/search.png'

const Search = ({title, value, placeholder, handleChangeText, otherStyles, ...props}) => {
  
  const [showpw, setshowpw] = useState(false)


  return (
      <View className="w-full border-2 border-black-200 px-4 border-black-200 h-16 bg-black-100 rounded-2xl items-center focus:border-secondary flex-row space-x-4">
      <TextInput
      className="text-base mt-0.5 flex-1 text-white font-pregular"
      value={value}
      placeholder='Search for an Item'
      placeholderTextColor="#7b7b8b"
      onChangeText={handleChangeText}
      
      />
      
      <TouchableOpacity>
        <Image
        source= {icon1}
        className= "w-5 h-5"
        resizeMode = 'contain'
        />
      </TouchableOpacity>
      </View>
  )
}

export default Search

