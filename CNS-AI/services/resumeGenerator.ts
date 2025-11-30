import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  BorderStyle,
  TabStopType,
  TabStopPosition,
  SectionType
} from "docx";
import saveAs from "file-saver";
import { ResumeData } from "../types";

// --- STYLES & HELPERS ---
const PRIMARY_COLOR = "2E74B5"; // Classic Blue
const TEXT_COLOR = "000000";
const GRAY_COLOR = "666666";

// Helper to create a bullet point
const createBullet = (text: string) => {
  return new Paragraph({
    text: text,
    bullet: { level: 0 },
    spacing: { after: 100 },
  });
};

const createSectionHeader = (text: string) => {
    return new Paragraph({
        text: text.toUpperCase(),
        heading: HeadingLevel.HEADING_2,
        thematicBreak: true, // Adds the line under
        spacing: { before: 200, after: 100 },
        border: {
            bottom: { color: "auto", space: 1, value: "single", size: 6 }
        }
    });
};

// --- TEMPLATE 1: CLASSIC (Standard, Top-Down, Clean) ---
// Good for ATS, Finance, Traditional roles.
const generateClassicResume = (data: ResumeData): Document => {
  return new Document({
    styles: {
        paragraphStyles: [
            {
                id: "Normal",
                name: "Normal",
                run: { font: "Calibri", size: 22, color: TEXT_COLOR }, // 11pt
                paragraph: { spacing: { line: 276 } }, // 1.15 line spacing
            },
            {
                id: "Heading1",
                name: "Heading 1",
                run: { font: "Calibri", size: 48, bold: true, color: PRIMARY_COLOR }, // Name
                paragraph: { alignment: AlignmentType.CENTER, spacing: { after: 100 } },
            },
            {
                id: "Heading2",
                name: "Heading 2",
                run: { font: "Calibri", size: 28, bold: true, smallCaps: true, color: PRIMARY_COLOR }, // Sections
                paragraph: { spacing: { before: 200, after: 100 } },
            },
            {
                id: "Subtitle",
                name: "Subtitle",
                run: { font: "Calibri", size: 24, color: GRAY_COLOR }, // Job Title below name
                paragraph: { alignment: AlignmentType.CENTER, spacing: { after: 200 } },
            }
        ]
    },
    sections: [{
      properties: {},
      children: [
        // Name
        new Paragraph({ text: data.fullName, style: "Heading1" }),
        // Role Title
        new Paragraph({ text: data.jobTitle, style: "Subtitle" }),
        
        // Contact Info (Single Line separated by pipes)
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
                new TextRun({ text: `${data.contact.email} | ${data.contact.phone} | ${data.contact.location}` }),
                data.contact.linkedin ? new TextRun({ text: ` | ${data.contact.linkedin}` }) : new TextRun(""),
            ],
            spacing: { after: 400 }
        }),

        // Summary
        createSectionHeader("Professional Summary"),
        new Paragraph({ text: data.summary, spacing: { after: 300 } }),

        // Experience
        createSectionHeader("Experience"),
        ...data.experience.flatMap(exp => [
            new Paragraph({
                children: [
                    new TextRun({ text: exp.title, bold: true, size: 24 }),
                    new TextRun({ text: ` | ${exp.company}`, italics: true }),
                    new TextRun({ 
                        text: `\t${exp.startDate} - ${exp.endDate}`, 
                        bold: true 
                    }),
                ],
                tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
                spacing: { before: 100 }
            }),
            ...exp.highlights.map(h => createBullet(h))
        ]),

        // Education
        createSectionHeader("Education"),
        ...data.education.map(edu => 
            new Paragraph({
                children: [
                    new TextRun({ text: edu.degree, bold: true }),
                    new TextRun({ text: `, ${edu.school}` }),
                    new TextRun({ text: `\t${edu.year}`, bold: true }),
                ],
                tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
                spacing: { after: 100 }
            })
        ),

        // Skills
        createSectionHeader("Skills"),
        ...data.skills.map(skillCat => 
             new Paragraph({
                children: [
                    new TextRun({ text: `${skillCat.category}: `, bold: true }),
                    new TextRun({ text: skillCat.items.join(", ") })
                ]
             })
        )
      ]
    }]
  });
};

// --- TEMPLATE 2: MODERN (Sidebar Layout) ---
// Good for Creative, Tech, Startups.
// Uses a Table with 2 columns: Left (30%) for Info/Skills, Right (70%) for Exp/Edu
const generateModernResume = (data: ResumeData): Document => {
    return new Document({
        styles: {
            paragraphStyles: [
                {
                    id: "Normal",
                    name: "Normal",
                    run: { font: "Helvetica", size: 20 }, // 10pt
                }
            ]
        },
        sections: [{
            properties: {
                page: {
                    margin: { top: 500, right: 500, bottom: 500, left: 500 }
                }
            },
            children: [
                // Header (Full Width)
                new Paragraph({
                    children: [
                        new TextRun({ text: data.fullName, bold: true, size: 48, color: PRIMARY_COLOR }),
                    ],
                    spacing: { after: 50 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: data.jobTitle, size: 24, color: GRAY_COLOR, smallCaps: true }),
                    ],
                    spacing: { after: 300 }
                }),

                // Main Layout Table (Invisible Borders)
                new Table({
                    columnWidths: [3000, 6000], // 30% / 70% roughly
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                        top: { style: BorderStyle.NONE },
                        bottom: { style: BorderStyle.NONE },
                        left: { style: BorderStyle.NONE },
                        right: { style: BorderStyle.NONE },
                        insideVertical: { style: BorderStyle.NONE },
                        insideHorizontal: { style: BorderStyle.NONE },
                    },
                    rows: [
                        new TableRow({
                            children: [
                                // LEFT COLUMN (Contact, Skills, Education)
                                new TableCell({
                                    width: { size: 30, type: WidthType.PERCENTAGE },
                                    margins: { right: 200 },
                                    children: [
                                        // Contact
                                        new Paragraph({ text: "CONTACT", heading: HeadingLevel.HEADING_3, color: PRIMARY_COLOR }),
                                        new Paragraph({ text: data.contact.email }),
                                        new Paragraph({ text: data.contact.phone }),
                                        new Paragraph({ text: data.contact.location }),
                                        new Paragraph({ text: data.contact.linkedin || "", spacing: { after: 300 } }),

                                        // Education (Moved to side for Modern look)
                                        new Paragraph({ text: "EDUCATION", heading: HeadingLevel.HEADING_3, color: PRIMARY_COLOR }),
                                        ...data.education.flatMap(edu => [
                                            new Paragraph({ text: edu.school, bold: true }),
                                            new Paragraph({ text: edu.degree }),
                                            new Paragraph({ text: edu.year, color: GRAY_COLOR, spacing: { after: 200 } }),
                                        ]),

                                        // Skills
                                        new Paragraph({ text: "SKILLS", heading: HeadingLevel.HEADING_3, color: PRIMARY_COLOR }),
                                        ...data.skills.flatMap(cat => [
                                            new Paragraph({ text: cat.category, bold: true, spacing: { before: 100 } }),
                                            ...cat.items.map(item => new Paragraph({ text: `• ${item}` }))
                                        ])
                                    ],
                                }),

                                // RIGHT COLUMN (Summary, Experience)
                                new TableCell({
                                    width: { size: 70, type: WidthType.PERCENTAGE },
                                    margins: { left: 200 },
                                    children: [
                                        // Summary
                                        new Paragraph({ text: "PROFILE", heading: HeadingLevel.HEADING_3, color: PRIMARY_COLOR }),
                                        new Paragraph({ text: data.summary, spacing: { after: 300 } }),

                                        // Experience
                                        new Paragraph({ text: "WORK EXPERIENCE", heading: HeadingLevel.HEADING_3, color: PRIMARY_COLOR }),
                                        ...data.experience.flatMap(exp => [
                                            new Paragraph({ 
                                                children: [
                                                    new TextRun({ text: exp.title, bold: true, size: 24 }),
                                                ],
                                                spacing: { before: 200 }
                                            }),
                                            new Paragraph({
                                                children: [
                                                    new TextRun({ text: exp.company, bold: true, color: GRAY_COLOR }),
                                                    new TextRun({ text: `  |  ${exp.startDate} - ${exp.endDate}`, color: GRAY_COLOR }),
                                                ],
                                                spacing: { after: 100 }
                                            }),
                                            ...exp.highlights.map(h => createBullet(h))
                                        ])
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        }],
    });
};

export const generateResumeDoc = async (data: ResumeData) => {
    // Randomly select a template for variety, or we could pass this as a param
    const useModern = Math.random() > 0.5;
    
    const doc = useModern ? generateModernResume(data) : generateClassicResume(data);

    const blob = await Packer.toBlob(doc);
    const fileName = `${data.fullName.replace(/\s+/g, "_")}_Resume.docx`;
    saveAs(blob, fileName);
    
    return { fileName, template: useModern ? "Modern" : "Classic" };
};