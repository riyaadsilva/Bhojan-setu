import mongoose from "mongoose";

const foodLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    food_name: {
      type: String,
      required: true,
      trim: true,
    },
    food_prepared: {
      type: Number,
      required: true,
      min: 0,
    },
    food_consumed: {
      type: Number,
      required: true,
      min: 0,
    },
    food_leftover: {
      type: Number,
      required: true,
      min: 0,
    },
    preparedQuantity: {
      type: Number,
      min: 0,
    },
    consumedQuantity: {
      type: Number,
      min: 0,
    },
    donatedQuantity: {
      type: Number,
      min: 0,
      default: 0,
    },
    wastedQuantity: {
      type: Number,
      min: 0,
      default: 0,
    },
    foodCategory: {
      type: String,
      default: "normal",
      trim: true,
    },
    logDate: {
      type: Date,
      default: Date.now,
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    donorType: {
      type: String,
      enum: ["individual", "restaurant"],
    },
    unit: {
      type: String,
      default: "kg/units",
    },
    notes: String,
  },
  { timestamps: true }
);

foodLogSchema.pre("validate", function syncDerivedFields(next) {
  if (this.preparedQuantity === undefined) this.preparedQuantity = this.food_prepared;
  if (this.consumedQuantity === undefined) this.consumedQuantity = this.food_consumed;
  if (this.food_prepared === undefined) this.food_prepared = this.preparedQuantity;
  if (this.food_consumed === undefined) this.food_consumed = this.consumedQuantity;

  if (!this.donorId && this.user) this.donorId = this.user;

  const prepared = Number.isFinite(this.preparedQuantity) ? this.preparedQuantity : this.food_prepared;
  const consumed = Number.isFinite(this.consumedQuantity) ? this.consumedQuantity : this.food_consumed;
  const donated = Number.isFinite(this.donatedQuantity) ? this.donatedQuantity : 0;

  if (!Number.isFinite(this.food_leftover) && Number.isFinite(prepared) && Number.isFinite(consumed)) {
    this.food_leftover = Math.max(prepared - consumed, 0);
  }

  if (Number.isFinite(prepared) && Number.isFinite(consumed)) {
    this.wastedQuantity = Math.max(prepared - consumed - donated, 0);
  }

  if (!this.logDate) this.logDate = this.createdAt || new Date();

  next();
});

const FoodLog = mongoose.model("FoodLog", foodLogSchema);

export default FoodLog;
