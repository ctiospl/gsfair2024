<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	let { open = $bindable(false), text = '' } = $props();
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Content
		class="!z-50 flex !min-h-full !min-w-full items-center justify-center bg-transparent"
	>
		<AlertDialog.Header
			class="absolute top-32 flex w-full items-center justify-center text-center text-white"
		>
			<AlertDialog.Title class="2xl">{text}</AlertDialog.Title>
		</AlertDialog.Header>
		<div class="animate-spin text-primary/60">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 100 100"
				preserveAspectRatio="xMidYMid"
				style="shape-rendering: auto; display: block; background: transparent;"
				width="200"
				height="200"
				><g data-idx="1"
					><g transform="matrix(1,0,0,1,50,50)" data-idx="2">
						<g transform="matrix(0.800000011920929,0,0,0.800000011920929,0,0)" data-idx="3">
							<g transform="matrix(1,0,0,1,-50,-50)" data-idx="4">
								<g
									data-idx="5"
									transform="matrix(0.7735319068827459,-0.6337573581697833,0.6337573581697833,0.7735319068827459,-20.36446325262645,43.01127256435188)"
								>
									<path
										d="M44.711 10.952c10.24-5.964 23.181-4.614 32.071 3.151l4.839 4.276l-6.414-1.238 c-8.102-1.688-16.88-0.113-24.532 4.276S37.284 32.67 34.696 40.547l-2.026 6.189l-1.238-6.414 C29.069 28.732 34.471 16.916 44.711 10.952z"
										fill="rgb(160, 207, 189)"
										data-idx="7"
									>
									</path>
									<path
										d="M32.333 61.253l6.189 2.138l-4.276-4.839c-5.514-6.189-8.552-14.517-8.552-23.406s3.038-17.217 8.552-23.406 l4.276-4.839l-6.189 2.138C21.079 12.865 13.54 23.33 13.54 35.258C13.54 46.849 21.079 57.427 32.333 61.253z"
										fill="rgb(139, 101, 129)"
										data-idx="9"
									>
									</path>
									<path
										d="M32.67 77.795c6.527 0 13.054-2.363 18.23-6.864l4.839-4.276l-6.414 1.238 c-8.102 1.688-16.88 0.113-24.532-4.276c-7.652-4.389-13.391-11.253-15.979-19.13l-2.026-6.189L5.55 44.711 C3.187 56.302 8.588 68.118 18.829 74.082C23.105 76.557 27.944 77.795 32.67 77.795z"
										fill="rgb(250, 221, 163)"
										data-idx="11"
									>
									</path>
									<path
										d="M68.568 59.678l-1.238-6.414l-2.026 6.189c-2.588 7.877-8.327 14.629-15.979 19.13 c-7.652 4.389-16.43 5.964-24.532 4.276l-6.414-1.238l4.839 4.276c5.176 4.501 11.703 6.864 18.23 6.864 c4.726 0 9.565-1.238 13.841-3.714C65.529 83.084 70.931 71.268 68.568 59.678z"
										fill="rgb(160, 207, 189)"
										data-idx="13"
									>
									</path>
									<path
										d="M67.667 38.747l-6.189-2.138l4.276 4.839c5.514 6.189 8.552 14.517 8.552 23.406s-3.038 17.217-8.552 23.406 l-4.276 4.839l6.189-2.138C78.921 87.135 86.46 76.67 86.46 64.742C86.46 53.151 78.921 42.573 67.667 38.747z"
										fill="rgb(139, 101, 129)"
										data-idx="15"
									>
									</path>
									<path
										d="M81.171 25.918c-10.24-5.964-23.181-4.614-32.071 3.151l-4.839 4.276l6.414-1.238 c8.102-1.688 16.88-0.113 24.532 4.276c7.652 4.389 13.391 11.253 15.979 19.13l2.026 6.189l1.238-6.414 C96.813 43.698 91.412 31.882 81.171 25.918z"
										fill="rgb(250, 221, 163)"
										data-idx="17"
									>
									</path>
								</g>
							</g>
						</g>
					</g><g data-idx="19"></g></g
				></svg
			>
		</div>
		<!-- <Loader class="h-16 w-16 animate-spin text-primary/60" /> -->
	</AlertDialog.Content>
</AlertDialog.Root>
