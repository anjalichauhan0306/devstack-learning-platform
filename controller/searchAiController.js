import Courses from "../model/courseModel.js";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

export const searchWithAi = async (req, res) => {
  try {
    const { input } = req.body;

    if (!input) {
      return res.status(400).json({ message: "Search Query is Required" });
    }

    const ai = new GoogleGenAI({
      apikey: process.env.GEMINI_API_KEY,
    });

    const prompt = `you are an intellignet assistent for an LMS Platform . A user Will type any query about what they want to laenr . your task is to understand the intent and return one ** most relavant keywokr** from the following list of course categories and levels and 
    -App Development 
    -Al/ML
    -Data Science
    -Data Analysis
    -Ethical Hacking 
    -Ui UX descingning 
    -web development
    -others
    -beginer
    -intermendiate
    -advanced
    The user is looking for courses with this query: "${input}".
    Expand this into 5-6 highly relevant technical keywords or synonyms that would help find the best results in a database.
    Example: If input is "Hacking", return: Ethical Hacking, Cybersecurity, Penetration Testing, Network Security, Kali Linux.
    Only return the keywords separated by commas
    
    -
     only reply with one single keyword from the list above that best matchs the query.Do not expailnt anything . no extra text 

    Query : ${input}
     `;

    const response = await ai.models.generateContent({
     model: "gemini-2.5-flash",
      contents: prompt,
    });

    const keyword = response.text;
    const courses = await Courses.find({
      isPublished: true,
      $or: [
        { title: { $regex: input, $options: "i" } },
        { subTitle: { $regex: input, $options: "i" } },
        { description: { $regex: input, $options: "i" } },
        { category: { $regex: input, $options: "i" } },
        { level: { $regex: input, $options: "i" } },
      ],
    });

    if (courses.length > 0) {
      return res.status(200).json(courses);
    } else {
      const courses = await Courses.find({
        isPublished: true,
        $or: [
          { title: { $regex: keyword, $options: "i" } },
          { subTitle: { $regex: keyword, $options: "i" } },
          { description: { $regex: keyword, $options: "i" } },
          { category: { $regex: keyword, $options: "i" } },
          { level: { $regex: keyword, $options: "i" } },
        ],
      });

      console.log(courses);
      
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};
