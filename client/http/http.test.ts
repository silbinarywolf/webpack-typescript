import { http } from "./http"

test("Test simple interpolation and query params", () => {
	let uri = http.buildUriAndParams("/api/Edit/Page/:id", {
		id: 1,
		queryParam: "test",
	})
	expect(uri).toBe("/api/Edit/Page/1?queryParam=test")
})

test("Test encoding of interpolation and query params", () => {
	let uri = http.buildUriAndParams("/api/Edit/Page/:id", {
		id: "id_with/_/_two_slashes",
		queryParam: "test_&with&_two_ampersands",
	})
	expect(uri).toBe("/api/Edit/Page/id_with%2F_%2F_two_slashes?queryParam=test_%26with%26_two_ampersands")
})

test("Dont mutate given JS Object", () => {
	const originalParams = {
		id: 1,
		queryParam: "test",
	}
	http.buildUriAndParams("/api/Edit/Page/:id", originalParams)
	if (!originalParams) {
		expect(originalParams).toBeTruthy()
		return
	}
	expect(Object.keys(originalParams).length).toBe(2)
})
