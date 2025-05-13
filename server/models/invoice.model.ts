import mongoose, { Document, Model, Schema } from "mongoose";

export interface IInvoiceCourse {
  courseId: string;
  courseName: string;
  priceAtPurchase: number;
}

export interface IInvoice extends Document {
  invoiceId: string; // Mã hóa đơn duy nhất
  userId: string;
  userName: string;
  userEmail: string;
  courses: IInvoiceCourse[];
  totalPrice: number;
  paymentInfo: {
    paymentIntentId?: string;
    status: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    created: number;
  };
  status: string; // Trạng thái hóa đơn
  createdAt: Date;
  updatedAt: Date;
}

const invoiceCourseSchema = new Schema<IInvoiceCourse>({
  courseId: { type: String, required: true },
  courseName: { type: String, required: true },
  priceAtPurchase: { type: Number, required: true },
});

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceId: {
      type: String,
      required: true,
      unique: true, // Mã hóa đơn duy nhất
    },
    userId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    courses: [invoiceCourseSchema],
    totalPrice: {
      type: Number,
      required: true,
    },
    paymentInfo: {
      paymentIntentId: { type: String },
      status: { type: String, required: true },
      amount: { type: Number, required: true },
      currency: { type: String, required: true },
      paymentMethod: { type: String, required: true },
      created: { type: Number, required: true },
    },
    status: {
      type: String,
      required: true,
      enum: ["Pending", "Completed", "Cancelled", "Failed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

const InvoiceModel: Model<IInvoice> = mongoose.model("Invoice", invoiceSchema);
export default InvoiceModel;