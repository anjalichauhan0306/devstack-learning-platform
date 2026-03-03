import path from "path";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import fs from "fs";
import axios from "axios";
import User from "../models/userModel.js";
import Courses from "../models/courseModel.js";
import Certificate from "../models/certificate.model.js";
import uploadOnCloudinary from "../config/cloudnary.js";

export const generateCertificate = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { score = 0, totalQuestions = 0 } = req.body;
    const userId = req.userId;
    const user = await User.findById(userId);
    const course = await Courses.findById(courseId);

    if (!user || !course) {
      return res.status(404).json({ message: "User or Course not found" });
    }

    const isEnrolled = user.enrolledCourses.some(
      (id) => id.toString() === courseId.toString(),
    );

    if (!isEnrolled) {
      return res.status(403).json({
        message: "User not enrolled in this course",
      });
    }

    const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

    if (percentage < 60) {
      return res.status(400).json({
        message: "Minimum 60% required for certificate",
      });
    }

    const existing = await Certificate.findOne({ userId, courseId });
    if (existing && existing.downloadUrl) {
      return res.redirect(existing.downloadUrl);
    }
    const certificateId =
      "CERT-" + crypto.randomBytes(8).toString("hex").toUpperCase();
    const rootPath = process.cwd();
    const pdfDir = path.join(rootPath, "certificates");
    const pdfPath = path.join(pdfDir, `certificate-${certificateId}.pdf`);

    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    const createPdf = () => {
      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ layout: "landscape", size: "A4" });
        const writeStream = fs.createWriteStream(pdfPath);

        doc.pipe(writeStream);

        const assetsPath = path.join(rootPath, "assets");
        doc.registerFont(
          "HeadingFont",
          path.join(assetsPath, "playfair_font.ttf"),
        );
        doc.registerFont(
          "SignatureFont",
          path.join(assetsPath, "AlexBrush-Regular.ttf"),
        );

        doc.image(path.join(assetsPath, "certificate-bg.png"), 0, 0, {
          width: doc.page.width,
          height: doc.page.height,
        });

        doc
          .font("HeadingFont")
          .fontSize(42)
          .fillColor("#1E293B")
          .text("CERTIFICATE OF COMPLETION", { align: "center" })
          .moveDown(1.5);
        doc.fontSize(18).text("This certificate is proudly presented to", {
          align: "center",
        });
        doc
          .moveDown()
          .fontSize(36)
          .fillColor("#C6A85C")
          .text(user.name.toUpperCase(), { align: "center" });
        doc
          .moveDown()
          .fontSize(18)
          .fillColor("#374151")
          .text(`For successfully completing: ${course.title}`, {
            align: "center",
          });
        doc
          .moveDown()
          .fontSize(16)
          .text(
            `Score: ${score}/${totalQuestions} (${percentage.toFixed(0)}%)`,
            { align: "center" },
          );
        doc.fontSize(14).text(`Certificate ID: ${certificateId}`, 500, 500);
        doc.font("SignatureFont").fontSize(28).text("Anjali Chauhan", 80, 450);

        doc.end();

        writeStream.on("finish", () => resolve(pdfPath));
        writeStream.on("error", (err) => reject(err));
      });
    };
    await createPdf();

    res.download(pdfPath, `Certificate-${certificateId}.pdf`, async (err) => {
      if (!err) {
        const cloudUrl = await uploadOnCloudinary(pdfPath, "Certificates");
        if (cloudUrl) {
          await Certificate.create({
            userId,
            courseId,
            certificateId,
            downloadUrl: cloudUrl,
          });
        }

        if (fs.existsSync(pdfPath)) {
          fs.unlinkSync(pdfPath);
        }
        return res.redirect(cloudUrl);
      } else {
        console.error("Download Error:", err);
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
