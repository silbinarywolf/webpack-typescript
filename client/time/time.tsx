export namespace time {
	export interface Time {
		toString(): string;
	}

	class timeInternal {
		private dateObject: Date;

		constructor(dateObject?: Date) {
			if (!dateObject) {
				dateObject = new Date();
			}
			this.dateObject = dateObject;
		}

		toString(): string {
			return this.dateObject.toUTCString();
		}
	}

	export function Now(): Time {
		const res = new timeInternal();
		return res;
	}
}
