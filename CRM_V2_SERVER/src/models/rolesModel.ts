import mongoose from "mongoose";

const roleSchema=new mongoose.Schema({
    roleId:{type:Number,required:true,unique:true},
    roleName:{type:String,required:true},
    permissions:{type:[String],required:true},
    createdBy:{type: mongoose.Schema.Types.ObjectId, ref: "User"},
},{timestamps:true});

export const RolesModel=mongoose.model('Role',roleSchema);