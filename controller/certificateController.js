// backend/controllers/certificateController.js
import path from "path";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import fs from "fs";
import User from "../model/userModel.js";
import Course from "../model/courseModel.js";
import Certificate from "../model/certificate.model.js";

export const generateCertificate = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { userId, score = 0, totalQuestions = 0 } = req.body;

    const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

    if (!userId) return res.status(400).json({ message: "User ID missing" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const existing = await Certificate.findOne({ userId, courseId });
    if (existing) {
      // If exists, just send the file
      return res.download(existing.downloadUrl, `certificate-${existing.certificateId}.pdf`);
    }
    

    // Optional: skip eligibility check, direct generate
    const certificateId = "CERT-" + crypto.randomBytes(4).toString("hex").toUpperCase();
    const pdfDir = path.join("certificates");
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir);
    const pdfPath = path.join(pdfDir, `certificate-${certificateId}.pdf`);

    const doc = new PDFDocument({ layout: "landscape", size: "A4" });
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    // Fonts
    doc.registerFont("HeadingFont", path.join("assets", "playfair_font.ttf"));
    doc.registerFont("SignatureFont", path.join("assets", "MomoSignature-Regular.ttf"));

    // Background
    doc.image(path.join("assets", "certificate-bg.png"), 0, 0, {
      width: doc.page.width,
      height: doc.page.height,
    });

    // Logo
    doc.image(path.join("assets", "logo.png"), 60, 50, { width: 120 });

    // Certificate Text
    doc
      .font("HeadingFont")
      .fontSize(42)
      .fillColor("#1E293B")
      .text("CERTIFICATE OF COMPLETION", { align: "center" })
      .moveDown(1.5);
    doc.fontSize(18).text("This certificate is proudly presented to", {
      align: "center",
    });
    doc.moveDown();
    doc.fontSize(36).fillColor("#C6A85C").text(user.name.toUpperCase(), {
      align: "center",
    });
    doc.moveDown();
    doc.fontSize(18).fillColor("#374151").text(
      `For successfully completing the course: ${course.title}`,
      { align: "center" }
    );
    doc.moveDown();
    doc.fontSize(16).text(
      `Score: ${score}/${totalQuestions} (${percentage.toFixed(0)}%)`,
      { align: "center" }
    );

    // Footer
    doc.fontSize(14).text(`Certificate ID: ${certificateId}`, 500, 500);
    doc.fontSize(14).text(`Date: ${new Date().toDateString()}`, 80, 500);
    doc.font("SignatureFont").fontSize(28).text("anjali Chauhan", 80, 450);
    doc.fontSize(12).text("anjali", 80, 480);

    doc.end();

    writeStream.on("finish", async () => {
      const certificate = new Certificate({
        userId,
        courseId,
        certificateId,
        downloadUrl: pdfPath,
      });
      await certificate.save();
      res.download(pdfPath, `certificate-${certificateId}.pdf`);
    });
  } catch (err) {
    console.log("Certificate error:", err);
    res.status(500).json({ message: "Certificate generation failed", error: err.message });
  }
};
