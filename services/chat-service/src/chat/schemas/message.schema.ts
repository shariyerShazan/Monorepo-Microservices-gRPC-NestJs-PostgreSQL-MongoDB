import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import type { Document } from "mongoose"

export type MessageDocument = Message & Document

@Schema({ timestamps: true })
export class Message {
  @Prop({ required: true })
  senderId: string

  @Prop({ required: true })
  receiverId: string

  @Prop({ required: true })
  message: string

  @Prop({ default: Date.now })
  createdAt: Date
}

export const MessageSchema = SchemaFactory.createForClass(Message)
