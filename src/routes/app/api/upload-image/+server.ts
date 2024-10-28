import fs from 'fs';
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
	const formData = await request.formData();
	const photo = formData.get('photo');
	// console.log('here');
			// const photo = formData.get('photo');
			const file = new File(photo, 'photo.jpg', { type: 'image/jpeg' });
			fs.writeFile('/static/photo.jpg', file, (err) => {
				if (err) throw err;
				console.log('The file has been saved!');
			});

	// Process and store the photo
	// This could involve saving the file to disk, a database, or an external service like AWS S3

	return json({   message: 'Image uploaded successfully' });
}


// export const actions: Actions = {
// 	default: async ({ request, locals }) => {
// 		console.log('here2');
// 		const formData = await request.formData();
// 		const photo = formData.get('photo');
// 		const file = new File([resizedBlob], 'photo.jpg', { type: 'image/jpeg' });
// 		fs.writeFile('/static/photo.jpg', file, (err) => {
// 			if (err) throw err;
// 			console.log('The file has been saved!');
// 		});
// 		// Process and store the photo
// 		// This could involve saving the file to disk, a database, or an external service like AWS S3

// 		return {
// 			status: 200,
// 			body: {
// 				message: 'Image uploaded successfully'
// 			}
// 		};
// 	}
// };
