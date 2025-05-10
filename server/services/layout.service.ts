import cloudinary from "cloudinary";
import CourseModel from "../models/course.model";
import LayoutModel from "../models/layout.model";
import ErrorHandler from "../utils/ErrorHandler";

export const createLayoutService = async (data: any) => {
  const { type } = data;
  const isTypeExist = await LayoutModel.findOne({ type });
  if (isTypeExist) {
    throw new ErrorHandler(`${type} đã tồn tại`, 400);
  }

  if (type === "Banner") {
    const { image, title, subTitle } = data;
    const myCloud = await cloudinary.v2.uploader.upload(image, {
      folder: "layout",
    });
    const banner = {
      type: "Banner",
      banner: {
        image: {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        },
        title,
        subTitle,
      },
    };
    await LayoutModel.create(banner);
  }

  if (type === "FAQ") {
    const { faq } = data;
    const faqItems = await Promise.all(
      faq.map(async (item: any) => ({
        question: item.question,
        answer: item.answer,
      }))
    );
    await LayoutModel.create({ type: "FAQ", faq: faqItems });
  }

  if (type === "Categories") {
    const { categories } = data;
    const categoriesItems = await Promise.all(
      categories.map(async (item: any) => ({
        title: item.title,
      }))
    );
    await LayoutModel.create({
      type: "Categories",
      categories: categoriesItems,
    });
  }

  return { message: "Layout created successfully" };
};

export const editLayoutService = async (data: any) => {
  const { type } = data;

  if (type === "Banner") {
    const bannerData: any = await LayoutModel.findOne({ type: "Banner" });
    const { image, title, subTitle } = data;

    const cloudData = image.startsWith("https")
      ? bannerData
      : await cloudinary.v2.uploader.upload(image, {
          folder: "layout",
        });

    const banner = {
      type: "Banner",
      image: {
        public_id: image.startsWith("https")
          ? bannerData.banner.image.public_id
          : cloudData?.public_id,
        url: image.startsWith("https")
          ? bannerData.banner.image.url
          : cloudData?.secure_url,
      },
      title,
      subTitle,
    };

    await LayoutModel.findByIdAndUpdate(bannerData._id, { banner });
  }

  if (type === "FAQ") {
    const { faq } = data;
    const FaqItem = await LayoutModel.findOne({ type: "FAQ" });
    const faqItems = await Promise.all(
      faq.map(async (item: any) => ({
        question: item.question,
        answer: item.answer,
      }))
    );
    await LayoutModel.findByIdAndUpdate(FaqItem?._id, {
      type: "FAQ",
      faq: faqItems,
    });
  }

  if (type === "Categories") {
    const { categories } = data;
    const categoriesData = await LayoutModel.findOne({ type: "Categories" });
    const categoriesItems = await Promise.all(
      categories.map(async (item: any) => ({
        title: item.title,
      }))
    );
    await LayoutModel.findByIdAndUpdate(categoriesData?._id, {
      type: "Categories",
      categories: categoriesItems,
    });
  }

  return { message: "Layout Updated successfully" };
};

export const getLayoutByTypeService = async (type: string) => {
  const layout = await LayoutModel.findOne({ type });
  return layout || { categories: [] };
};

export const getFilterOptionsService = async () => {
  const layout = await LayoutModel.findOne({ type: "Categories" });
  const categories = layout?.categories.map((cat) => cat.title) || [];

  const levels = await CourseModel.distinct("level");

  const priceRange = await CourseModel.aggregate([
    {
      $group: {
        _id: null,
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
  ]);
  const minPrice = priceRange[0]?.minPrice || 0;
  const maxPrice = priceRange[0]?.maxPrice || 0;

  const ratings = await CourseModel.distinct("ratings");
  const purchased = await CourseModel.distinct("purchased");

  return {
    categories: ["Tất cả", ...categories],
    levels: ["Tất cả", ...levels],
    priceRange: { minPrice, maxPrice },
    ratings: [null, ...ratings.sort()],
    purchased: [null, ...purchased.sort()],
  };
};