export default function FooterCafeNegro() {
    return (
        <footer className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-gray-400">
            {/* Footer */}
            <div className="mt-10 border-t border-gray-200 py-8 pb-10 text-center">

                {/* Powered by */}
                <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                    <span>Powered by</span>

                    <img
                        src="/logoText.png"
                        alt="PhotoBook.com.ar"
                        className="h-9 object-contain opacity-90"
                    />

                    <span className="font-bold text-gray-600">
                        PhotoBook.com.ar
                    </span>
                </div>

                {/* Created by */}
                <div className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-gray-400">
                    <span>Created by</span>

                    <img
                        src="/logoCafeNegro.png"
                        alt="CafeNegro"
                        className="h-9 object-contain opacity-90"
                    />

                    <span className="font-bold text-gray-600">
                        cafenegro.com.ar
                    </span>
                </div>
            </div>
        </footer>
    )
}