import { createSlice } from "@reduxjs/toolkit";

const signupSlice = createSlice({
    name:"signup",
    initialState:{
        value:null,
    },
    reducers:{
     signup:(state, action)=>{
        state.value = action.payload
     },
     logout:(state)=>{
        state.value = null
     }
    }
})
export const {signup, logout} = signupSlice.actions;
export default signupSlice.reducer;