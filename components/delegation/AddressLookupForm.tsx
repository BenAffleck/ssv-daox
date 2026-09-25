export default function AddressLookupForm({ defaultValue = '' }: { defaultValue?: string }) {
  return (
    <form action="/delegation" className="mx-auto mt-6 flex max-w-xl gap-2">
      <input
        name="address"
        defaultValue={defaultValue}
        placeholder="0x…"
        aria-label="Ethereum address"
        className="filter-input flex-1 font-mono"
        required
      />
      <button
        type="submit"
        className="rounded-lg bg-secondary px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-secondary/90"
      >
        Look up
      </button>
    </form>
  );
}
