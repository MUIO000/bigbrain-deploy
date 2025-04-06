function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Tailwind CSS 演示
        </h1>
        
        {/* 卡片样式示例 */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">卡片示例</h2>
          <p className="text-gray-600 mb-4">
            这是一个使用 Tailwind CSS 样式的简单卡片组件。如果您能看到这个样式，说明 Tailwind CSS 已经正确配置。
          </p>
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition duration-200">
            点击我
          </button>
        </div>
        
        {/* 网格布局示例 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-red-100 p-4 rounded-lg shadow">
            <h3 className="font-medium text-red-800">红色面板</h3>
            <p className="text-red-600 text-sm">使用红色主题的卡片</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg shadow">
            <h3 className="font-medium text-green-800">绿色面板</h3>
            <p className="text-green-600 text-sm">使用绿色主题的卡片</p>
          </div>
          <div className="bg-blue-100 p-4 rounded-lg shadow">
            <h3 className="font-medium text-blue-800">蓝色面板</h3>
            <p className="text-blue-600 text-sm">使用蓝色主题的卡片</p>
          </div>
        </div>
        
        {/* 表单元素示例 */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">表单示例</h2>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              用户名
            </label>
            <input 
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500" 
              id="username" 
              type="text" 
              placeholder="请输入用户名"
            />
          </div>
          <div className="flex items-center justify-between">
            <button className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
              提交
            </button>
            <a className="inline-block align-baseline font-bold text-sm text-purple-500 hover:text-purple-800" href="#">
              忘记密码?
            </a>
          </div>
        </div>
        
        {/* 响应式设计示例 */}
        <div className="bg-yellow-50 p-4 rounded-lg shadow-md border border-yellow-200">
          <h2 className="text-yellow-800 text-lg font-medium mb-2">响应式设计示例</h2>
          <p className="text-yellow-700 mb-2">
            调整浏览器窗口大小，观察下面元素的变化:
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="bg-white p-4 rounded shadow flex-1">
              <p className="text-sm sm:text-base md:text-lg lg:text-xl">
                这个文本会根据屏幕大小改变大小
              </p>
            </div>
            <div className="bg-white p-4 rounded shadow flex-1 hidden md:block">
              <p>这个元素在中等屏幕以上才会显示</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
