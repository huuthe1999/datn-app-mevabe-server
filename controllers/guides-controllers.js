/** @format */

const CustomError = require("../models/custom-error");

const Guide = require("../models/guide");
const Category = require("../models/category-guide");

const getGuide = async (req, res, next) => {
  const { category, textSearch } = req.query;
  let { limit, page } = req.query;

  limit = parseInt(limit);
  page = parseInt(page);

  const guideList = {};

  const startIndex = (page - 1) * limit;

  let totalDocuments;

  if (!category && !textSearch) {
    try {
      guideList.data = await Guide.find()
        .skip(startIndex)
        .limit(limit)
        .populate("category", "-guides")
        .sort({ createAt: 1 });
      totalDocuments = await Guide.countDocuments();
    } catch (err) {
      return CustomError(res, "Lấy thông tin guides thất bại, thử lại!", -1101); // Lỗi lấy thông tin guides từ database
    }
  } else {
    if (category && textSearch) {
      try {
        guideList.data = await Guide.find({
          $text: {
            $search: `\"${textSearch}\"`,
          },
          category: category,
        })
          .skip(startIndex)
          .limit(limit)
          .populate("category", "-guides")
          .sort({ createAt: 1 });
        totalDocuments = await Guide.countDocuments({
          $text: {
            $search: `\"${textSearch}\"`,
          },
          category: category,
        });
      } catch (err) {
        return CustomError(
          res,
          "Lấy thông tin guides thất bại, thử lại!",
          -1102
        ); // Lỗi lấy thông tin guides từ database
      }
    } else {
      if (category && !textSearch) {
        try {
          guideList.data = await Guide.find({
            category: category,
          })
            .skip(startIndex)
            .limit(limit)
            .populate("category", "-guides")
            .sort({ createAt: 1 });
          totalDocuments = await Guide.countDocuments({
            category: category,
          });
        } catch (err) {
          return CustomError(
            res,
            "Lấy thông tin guides thất bại, thử lại!",
            -1103
          ); // Lỗi lấy thông tin guides từ database
        }
      } else {
        try {
          guideList.data = await Guide.find({
            $text: {
              $search: `\"${textSearch}\"`,
            },
          })
            .skip(startIndex)
            .limit(limit)
            .populate("category", "-guides")
            .sort({ createAt: 1 });
          totalDocuments = await Guide.countDocuments({
            $text: {
              $search: `\"${textSearch}\"`,
            },
          });
        } catch (err) {
          return CustomError(
            res,
            "Lấy thông tin guides thất bại, thử lại!",
            -1104
          ); // Lỗi lấy thông tin guides từ database
        }
      }
    }
  }

  if (Number.isNaN(totalDocuments)) {
    totalDocuments = 0;
  }

  if (Number.isNaN(limit)) {
    limit = totalDocuments;
  }

  if (Number.isNaN(page)) {
    page = 1;
  }

  guideList.currentPage = {
    page,
    limit,
  };

  guideList.totalPages = limit == 0 ? 0 : Math.ceil(totalDocuments / limit);
  guideList.totalRecords = totalDocuments;
  const endIndex = page * limit;

  if (page > 1) {
    guideList.previous = {
      page: page - 1,
      limit: limit,
    };
  }

  if (endIndex < totalDocuments) {
    guideList.next = {
      page: page + 1,
      limit: limit,
    };
  }

  res.json({
    message: "Success",
    status: 200,
    data: guideList,
  });
};

const getAllCategory = async (req, res, next) => {
  let categories;
  try {
    categories = await Category.find({}).populate("guides", "-category");
  } catch (err) {
    return CustomError(
      res,
      "Lấy thông tin categories thất bại, thử lại!",
      -2101
    );
  }

  res.json({
    message: "Success",
    status: 200,
    data: {
      categories: categories ? categories : [],
    },
  });
};

const getGuideByID = async (req, res, next) => {
  const gId = req.params.gid;

  let guide;
  try {
    guide = await Guide.findById(gId).populate("category", "-guides");
  } catch (err) {
    return CustomError(res, "Lấy thông tin guide thất bại, thử lại!", -3101);
  }

  if (!guide || guide.length === 0) {
    return CustomError(
      res,
      "Không tìm thấy guide theo id được cung cấp!",
      -3001
    );
  }

  res.json({
    message: "Success",
    status: 200,
    data: {
      guide,
    },
  });
};

const getCategoryByID = async (req, res, next) => {
  const cId = req.params.cid;

  let category;
  try {
    category = await Category.findById(cId).populate("guides", "-category");
  } catch (err) {
    return CustomError(res, "Lấy thông tin category thất bại, thử lại!", -4101);
  }

  if (!category || category.length === 0) {
    return CustomError(
      res,
      "Không tìm thấy category theo id được cung cấp!",
      -4001
    );
  }

  res.json({
    message: "Success",
    status: 200,
    data: {
      category,
    },
  });
};

const getSuggestion = async (req, res, next) => {
  let guideList;
  try {
    guideList = await Category.find({}).populate({
      path: "guides",
      options: {
        perDocumentLimit: 3,
        sort: {
          createAt: -1,
        },
      },
    });
  } catch (err) {
    return CustomError(res, "Lấy thông tin guides thất bại, thử lại!", -7101); // Lỗi lấy thông tin guides từ database
  }

  res.json({
    message: "Success",
    status: 200,
    data: {
      guideList,
    },
  });
};

const createGuide = async (req, res, next) => {
  const { title, thumbnail, content, description, info, category } = req.body;

  const createGuide = new Guide({
    title,
    thumbnail,
    content,
    description,
    info,
    category,
    createAt: new Date().getTime(),
    updateAt: new Date().getTime(),
  });

  let guide;
  try {
    guide = await createGuide.save();
  } catch (err) {
    return CustomError(res, "That bai!", -9999);
  }

  try {
    await Category.findByIdAndUpdate(category, {
      $push: { guides: [guide._id] },
    });
  } catch (error) {
    return CustomError(res, "That bai!", -1000);
  }

  res.json({
    message: "Tao thanh cong",
    status: 200,
    data: {
      createGuide,
    },
  });
};

const createCategory = async (req, res, next) => {
  const { name, thumbnail } = req.body;

  const createCategory = new Category({
    name,
    thumbnail,
    guides: [],
    createAt: new Date().getTime(),
    updateAt: new Date().getTime(),
  });

  let category;
  try {
    category = await createCategory.save();
    res.json({
      message: "Tao thanh cong",
      status: 200,
      data: {
        category,
      },
    });
  } catch (err) {
    return CustomError(res, "That bai!", -9999);
  }
};

const updateGuideByID = async (req, res, next) => {
  const gId = req.params.gid;

  let guide;
  try {
    guide = await Guide.findById(gId);
  } catch (err) {
    return CustomError(res, "Lấy thông tin guide thất bại, thử lại!", -5101);
  }

  if (!guide || guide.length === 0) {
    return CustomError(res, "Không tìm thấy guide từ id được cung cấp!", -5001);
  }

  const { title, thumbnail, content, description, info, category } = req.body;

  guide.title = typeof title !== "undefined" ? title : guide.title;
  guide.thumbnail =
    typeof thumbnail !== "undefined" ? thumbnail : guide.thumbnail;
  guide.content = typeof content !== "undefined" ? content : guide.content;
  guide.description =
    typeof description !== "undefined" ? description : guide.description;
  guide.info = typeof info !== "undefined" ? info : guide.info;
  guide.updateAt = new Date().getTime();

  if (typeof category !== "undefined" && category != guide.category) {
    let categoryGuide;
    try {
      categoryGuide = await Category.findById(category);
    } catch (err) {
      return CustomError(
        res,
        "Lấy thông tin category thất bại, thử lại!",
        -5102
      );
    }

    if (!categoryGuide || categoryGuide.length === 0) {
      return CustomError(
        res,
        "Không tìm thấy category từ id được cung cấp!",
        -5002
      );
    }

    try {
      await Category.findByIdAndUpdate(category, {
        $push: { guides: [gId] },
      });

      await Category.findByIdAndUpdate(guide.category, {
        $pullAll: { guides: [gId] },
      });
      guide.category = category;
    } catch (error) {
      return CustomError(res, "Cập nhật guide thất bại, thử lại!", -5103);
    }
  }

  try {
    await guide.save();
    res.json({
      message: "Success",
      status: 200,
      data: {
        guide,
      },
    });
  } catch (error) {
    return CustomError(res, "Cập nhật guide thất bại, thử lại!", -5103);
  }
};

const deleteGuideByID = async (req, res, next) => {
  const gId = req.params.gid;

  let guide;
  try {
    guide = await Guide.findByIdAndDelete(gId);
  } catch (err) {
    return CustomError(res, "Xóa guide thất bại, thử lại!", -6101);
  }

  if (!guide || guide.length === 0) {
    return CustomError(res, "Không tìm thấy guide từ id được cung cấp!", -6001);
  }

  try {
    await Category.findByIdAndUpdate(guide.category, {
      $pullAll: { guides: [gId] },
    });
    res.json({
      message: "Success",
      status: 200,
    });
  } catch (error) {
    return CustomError(res, "Xóa guide thất bại, thử lại!", -6102);
  }
};

exports.getGuide = getGuide;
exports.getAllCategory = getAllCategory;
exports.getGuideByID = getGuideByID;
exports.getCategoryByID = getCategoryByID;
exports.getSuggestion = getSuggestion;
exports.createGuide = createGuide;
exports.createCategory = createCategory;
exports.updateGuideByID = updateGuideByID;
exports.deleteGuideByID = deleteGuideByID;
