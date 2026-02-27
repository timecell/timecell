import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Renders a DOM element to a single-page PDF and triggers a browser download.
 *
 * Dark-theme safe: forces the capture background to slate-900 (#0f172a) so
 * transparent/backdrop-blur surfaces don't render as white on the canvas.
 */
export async function exportReportCardPdf(
	element: HTMLElement,
	filename?: string,
): Promise<void> {
	const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
	const pdfFilename = filename ?? `timecell-report-${date}.pdf`;

	// Render the element to a canvas.
	// backgroundColor matches bg-slate-900 so dark UI looks correct.
	const canvas = await html2canvas(element, {
		backgroundColor: "#0f172a",
		scale: 2, // 2x for retina-quality output
		useCORS: true,
		logging: false,
		// Ensure the full element is captured even if it overflows the viewport
		windowWidth: element.scrollWidth,
		windowHeight: element.scrollHeight,
	});

	const imgData = canvas.toDataURL("image/png");

	// A4 dimensions in mm
	const A4_W = 210;
	const A4_H = 297;

	// Scale canvas to fit A4 width, preserving aspect ratio
	const canvasAspect = canvas.height / canvas.width;
	const imgW = A4_W;
	const imgH = imgW * canvasAspect;

	// If content is taller than A4, shrink to fit on one page
	let finalW = imgW;
	let finalH = imgH;
	if (imgH > A4_H) {
		finalH = A4_H;
		finalW = A4_H / canvasAspect;
	}

	// Centre horizontally if we had to shrink
	const xOffset = (A4_W - finalW) / 2;
	const yOffset = (A4_H - finalH) / 2;

	const pdf = new jsPDF({
		orientation: imgH > A4_H ? "portrait" : "portrait",
		unit: "mm",
		format: "a4",
	});

	pdf.addImage(imgData, "PNG", xOffset, yOffset > 0 ? yOffset : 0, finalW, finalH);

	pdf.save(pdfFilename);
}
